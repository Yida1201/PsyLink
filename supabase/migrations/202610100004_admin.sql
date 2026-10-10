-- Apply after migrations 001–003. No chat contents or client service-role key.
create table public.bloomie_staff(user_id uuid primary key references auth.users(id) on delete cascade, role text not null check(role in ('admin','editor','reviewer')));
create function public.bloomie_role() returns text language sql stable security definer set search_path='' as $$ select role from public.bloomie_staff where user_id=(select auth.uid()) $$;
revoke all on function public.bloomie_role() from public,anon;
grant execute on function public.bloomie_role() to authenticated;
alter table public.bloomie_staff enable row level security;
create policy staff_read on public.bloomie_staff for select to authenticated using(user_id=(select auth.uid()) or (select public.bloomie_role())='admin');
grant select on public.bloomie_staff to authenticated;
revoke all on public.bloomie_staff from anon;
create table public.bloomie_records(
 id text primary key check(id ~ '^[a-zA-Z0-9_-]{1,100}$'),
 content_id text not null check(content_id ~ '^[a-zA-Z0-9_-]{1,100}$'),
 kind text not null check(kind in ('article','podcast','knowledge','professional')),
 locale text not null check(locale in ('zh-CN','en-US','es','ja','ko')),
 payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<120000),
 status text not null default 'draft' check(status in ('draft','review','published','archived')),
 version integer not null default 1,updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id),unique(kind,content_id,locale)
);
alter table public.bloomie_records enable row level security;
create policy record_read on public.bloomie_records for select to authenticated using((select public.bloomie_role()) in ('admin','editor','reviewer'));
grant select on public.bloomie_records to authenticated;
revoke all on public.bloomie_records from anon;
create table public.bloomie_publications(
 id text primary key references public.bloomie_records(id),content_id text not null,kind text not null,locale text not null,
 payload jsonb not null,active boolean not null,updated_at timestamptz not null default now()
);
alter table public.bloomie_publications enable row level security;
create policy published_read on public.bloomie_publications for select to anon,authenticated using(true);
grant select on public.bloomie_publications to anon,authenticated;
create table public.bloomie_audit(id uuid primary key default gen_random_uuid(),record_id text not null,action text not null,actor uuid references auth.users(id),created_at timestamptz not null default now(),version integer not null,details jsonb not null default '{}'::jsonb);
alter table public.bloomie_audit enable row level security;
create policy audit_read on public.bloomie_audit for select to authenticated using((select public.bloomie_role()) in ('admin','editor','reviewer'));
grant select on public.bloomie_audit to authenticated;
revoke all on public.bloomie_audit from anon;
-- Writes only through these role-checked, optimistic-locking transactions.
revoke insert,update,delete on public.bloomie_records,public.bloomie_publications,public.bloomie_audit,public.bloomie_staff from anon,authenticated;
create function public.bloomie_save(item jsonb,expected_version integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.bloomie_records; p jsonb:=item->'payload'; rid text:=item->>'id';
begin
 if public.bloomie_role() is null or public.bloomie_role() not in ('admin','editor') then raise exception 'Forbidden' using errcode='42501'; end if;
 if jsonb_typeof(p) is distinct from 'object' or coalesce(length(trim(p->>'title')),0)=0 or length(p->>'title')>180 or jsonb_typeof(p->'paragraphs') is distinct from 'array' or jsonb_typeof(p->'keywords') is distinct from 'array' or jsonb_typeof(p->'isDemo') is distinct from 'boolean' or jsonb_typeof(p->'knowledgeEnabled') is distinct from 'boolean' or jsonb_typeof(p->'research') is distinct from 'boolean' then raise exception 'Invalid payload'; end if;
 select * into r from public.bloomie_records where id=rid for update;
 if found then
  if r.version<>expected_version then raise exception 'Conflict' using errcode='40001'; end if;
  if r.content_id<>item->>'content_id' or r.kind<>item->>'kind' or r.locale<>item->>'locale' then raise exception 'Identity immutable'; end if;
  update public.bloomie_records set payload=p,status='draft',version=version+1,updated_at=now(),updated_by=auth.uid() where id=rid returning * into r;
 else
  if expected_version<>0 then raise exception 'Conflict' using errcode='40001'; end if;
  insert into public.bloomie_records(id,content_id,kind,locale,payload,updated_by) values(rid,item->>'content_id',item->>'kind',item->>'locale',p,auth.uid()) returning * into r;
 end if;
 insert into public.bloomie_audit(record_id,action,actor,version) values(r.id,'save',auth.uid(),r.version);
 return to_jsonb(r);
end $$;
create function public.bloomie_transition(record_id text,expected_version integer,next_status text,review_checks jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.bloomie_records;p jsonb;role_name text:=public.bloomie_role();
begin
 if role_name is null then raise exception 'Forbidden' using errcode='42501';end if;
 if next_status='review' then
  if role_name not in ('admin','editor') then raise exception 'Forbidden' using errcode='42501';end if;
 elsif next_status in ('published','archived','draft') then
  if role_name not in ('admin','reviewer') then raise exception 'Forbidden' using errcode='42501';end if;
 else raise exception 'Invalid status';end if;
 select * into r from public.bloomie_records where id=record_id for update;
 if not found then raise exception 'Not found';end if;
 if r.version<>expected_version then raise exception 'Conflict' using errcode='40001';end if;
 p:=r.payload;
 if next_status='review' and r.status<>'draft' then raise exception 'Needs draft';end if;
 if next_status='published' then
  if r.status<>'review' or review_checks->'source' is distinct from 'true'::jsonb or review_checks->'rights' is distinct from 'true'::jsonb or review_checks->'professional' is distinct from 'true'::jsonb then raise exception 'Needs verified review';end if;
  if r.kind in ('article','knowledge') then
   if not exists(select 1 from jsonb_array_elements(p->'paragraphs') s where length(trim(s->>'heading'))>0 and length(trim(s->>'text'))>0) or coalesce(p#>>'{source,url}','') !~ '^https://[^[:space:]]+$' or coalesce(p#>>'{source,title}','')='' or coalesce(p#>>'{source,publisher}','')='' or coalesce(p#>>'{source,checked}','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Needs source and body';end if;
   if (r.kind='knowledge' or p->'knowledgeEnabled'='true'::jsonb) and jsonb_array_length(p->'keywords')<1 then raise exception 'Needs keywords';end if;
   if (r.kind='knowledge' or p->'research'='true'::jsonb) and jsonb_array_length(p->'paragraphs')<3 then raise exception 'Needs scope and limitations';end if;
  end if;
  if r.kind='professional' and p->'isDemo' is distinct from 'true'::jsonb then
   if coalesce(p->>'qualification','')='' or coalesce(p->>'qualificationReference','') !~ '^https://[^[:space:]]+$' or coalesce(p->>'contactUrl','') !~ '^https://[^[:space:]]+$' or coalesce(p->>'consentNote','')='' then raise exception 'Needs credentials and consent';end if;
  end if;
  if r.kind='podcast' and p->'isDemo' is distinct from 'true'::jsonb and coalesce(p->>'audioUrl','') !~ '^https://[^[:space:]]+$' then raise exception 'Needs licensed audio';end if;
  insert into public.bloomie_publications(id,content_id,kind,locale,payload,active) values(r.id,r.content_id,r.kind,r.locale,p-'qualificationReference'-'consentNote',true) on conflict(id) do update set payload=excluded.payload,active=true,updated_at=now();
 elsif next_status='archived' then
  insert into public.bloomie_publications(id,content_id,kind,locale,payload,active) values(r.id,r.content_id,r.kind,r.locale,'{}'::jsonb,false) on conflict(id) do update set payload='{}'::jsonb,active=false,updated_at=now();
 end if;
 update public.bloomie_records set status=next_status,version=version+1,updated_at=now(),updated_by=auth.uid() where id=r.id returning * into r;
 insert into public.bloomie_audit(record_id,action,actor,version,details) values(r.id,next_status,auth.uid(),r.version,case when next_status='published' then jsonb_build_object('source',true,'rights',true,'professional',true) else '{}'::jsonb end);
 return to_jsonb(r);
end $$;
create function public.bloomie_set_staff(target_user uuid,next_role text) returns void language plpgsql security definer set search_path='' as $$
begin
 if public.bloomie_role() is distinct from 'admin' then raise exception 'Forbidden' using errcode='42501';end if;
 -- Serialize role changes, so concurrent demotions cannot remove the last admin.
 perform pg_advisory_xact_lock(73910241);
 if next_role not in ('admin','editor','reviewer','remove') then raise exception 'Invalid role';end if;
 if exists(select 1 from public.bloomie_staff where user_id=target_user and role='admin') and next_role<>'admin' and (select count(*) from public.bloomie_staff where role='admin')<=1 then raise exception 'Keep one admin';end if;
 if next_role='remove' then delete from public.bloomie_staff where user_id=target_user;
 else insert into public.bloomie_staff values(target_user,next_role) on conflict(user_id) do update set role=excluded.role;end if;
 insert into public.bloomie_audit(record_id,action,actor,version) values(target_user::text,'role:'||next_role,auth.uid(),0);
end $$;
revoke all on function public.bloomie_save(jsonb,integer),public.bloomie_transition(text,integer,text,jsonb),public.bloomie_set_staff(uuid,text) from public,anon;
grant execute on function public.bloomie_save(jsonb,integer),public.bloomie_transition(text,integer,text,jsonb),public.bloomie_set_staff(uuid,text) to authenticated;
-- Managed IDs replace the old fixed allowlist. Keep user isolation from migration 001.
alter table public.favorites drop constraint if exists favorites_article_id_check;
alter table public.favorites add constraint favorites_article_id_check check(article_id ~ '^[a-zA-Z0-9_-]{1,100}$');
create function public.bloomie_favorite_allowed(article_id text) returns boolean language sql stable security definer set search_path='' as $$
 select article_id in ('pause','listen','boundaries','together','research-reading','research-sleep','research-stress','research-screen','research-responsive') or exists(select 1 from public.bloomie_publications p where p.active and p.kind='article' and p.content_id=article_id)
$$;
revoke all on function public.bloomie_favorite_allowed(text) from public,anon;
grant execute on function public.bloomie_favorite_allowed(text) to authenticated;
drop policy "insert own favorites" on public.favorites;
create policy "insert own favorites" on public.favorites for insert to authenticated with check((select auth.uid())=user_id and public.bloomie_favorite_allowed(article_id));
drop policy "update own favorites" on public.favorites;
create policy "update own favorites" on public.favorites for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id and public.bloomie_favorite_allowed(article_id));
-- Bootstrap one real administrator separately in the SQL editor using their auth.users UUID.
