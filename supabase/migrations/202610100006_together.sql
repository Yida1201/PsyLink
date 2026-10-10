-- Apply after 005. Stores editorial content and RSVP only, never child ages, activity notes or completion history.
create table public.together_items(id text primary key check(id ~ '^[a-zA-Z0-9_-]{1,100}$'),kind text not null check(kind in ('activity','circle')),data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<40000),version integer not null default 1,published boolean not null default false,deleted boolean not null default false,updated_at timestamptz not null default now(),updated_by uuid references auth.users(id));
create table public.together_publications(id text primary key references public.together_items(id),kind text not null,data jsonb not null,version integer not null,active boolean not null,updated_at timestamptz not null default now());
create table public.together_registrations(event_id text references public.together_items(id),user_id uuid references auth.users(id) on delete cascade,status text not null check(status in ('interested','cancelled')),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),primary key(event_id,user_id));
create table public.together_audit(id uuid primary key default gen_random_uuid(),item_id text not null,action text not null,actor uuid references auth.users(id) on delete set null,version integer not null,checks jsonb not null default '{}',created_at timestamptz not null default now());
alter table public.together_items enable row level security;
alter table public.together_publications enable row level security;
alter table public.together_registrations enable row level security;
alter table public.together_audit enable row level security;
create policy together_staff on public.together_items for select to authenticated using((select public.bloomie_role()) in ('admin','editor','reviewer'));
-- Inactive snapshots contain only ID/kind/version and {} data, to suppress built-in entries after withdrawal.
create policy together_public on public.together_publications for select to anon,authenticated using(true);
create policy together_owner on public.together_registrations for select to authenticated using(user_id=(select auth.uid()) or (select public.bloomie_role())='admin');
create policy together_audit_staff on public.together_audit for select to authenticated using((select public.bloomie_role()) in ('admin','editor','reviewer'));
grant select on public.together_items,public.together_registrations,public.together_audit to authenticated;
grant select on public.together_publications to anon,authenticated;
revoke all on public.together_items,public.together_registrations,public.together_audit from anon;
revoke insert,update,delete on public.together_items,public.together_publications,public.together_registrations,public.together_audit from anon,authenticated;
create function public.together_valid(k text,p jsonb) returns boolean language plpgsql set search_path='' as $$
declare l text;c jsonb;v jsonb;field text;
begin
 if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>40000 or coalesce(p->>'id','') !~ '^[a-zA-Z0-9_-]{1,100}$' or coalesce(p->>'category','') not in ('read','routine','emotion','move') then return false;end if;
 if k='activity' then
  if coalesce(p->>'age','') not in ('baby','toddler','preschool') or jsonb_typeof(p->'minutes') is distinct from 'number' or (p->>'minutes')::numeric<>trunc((p->>'minutes')::numeric) or (p->>'minutes')::integer not between 5 and 10 or coalesce(p->>'relatedArticleId','') !~ '^[a-zA-Z0-9_-]{1,100}$' or coalesce(p->>'reviewStatus','') not in ('draft','reviewed') or jsonb_typeof(p->'scopeNote') is distinct from 'string' or length(p->>'scopeNote')>2000 or jsonb_typeof(p->'sourceUrl') is distinct from 'string' or length(p->>'sourceUrl')>2000 or ((p->>'sourceUrl')<>'' and (p->>'sourceUrl') !~ '^https://[^[:space:]@]+$') or jsonb_typeof(p->'copy') is distinct from 'object' or (select count(*) from jsonb_object_keys(p->'copy'))<>2 then return false;end if;
  foreach l in array array['zh-CN','en-US'] loop
   c:=p->'copy'->l;
   if jsonb_typeof(c->'title') is distinct from 'string' or coalesce(length(trim(c->>'title')),0)=0 or length(c->>'title')>180 or jsonb_typeof(c->'why') is distinct from 'string' or length(c->>'why')>1000 or jsonb_typeof(c->'materials') is distinct from 'array' or jsonb_array_length(c->'materials') not between 1 and 10 or jsonb_typeof(c->'steps') is distinct from 'array' or jsonb_array_length(c->'steps') not between 3 and 5 then return false;end if;
   for v in select value from jsonb_array_elements(c->'materials') loop if jsonb_typeof(v)<>'string' or length(v#>>'{}')>300 then return false;end if;end loop;
   for v in select value from jsonb_array_elements(c->'steps') loop if jsonb_typeof(v)<>'string' or length(v#>>'{}')>1000 then return false;end if;end loop;
  end loop;
 elsif k='circle' then
  if coalesce(p->>'weekOf','') !~ '^\d{4}-\d{2}-\d{2}$' or to_char((p->>'weekOf')::date,'YYYY-MM-DD')<>p->>'weekOf' or extract(isodow from (p->>'weekOf')::date)<>1 or coalesce(p->>'start','') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$' or not isfinite((p->>'start')::timestamptz) or not exists(select 1 from pg_catalog.pg_timezone_names where name=p->>'timeZone') or jsonb_typeof(p->'durationMinutes') is distinct from 'number' or (p->>'durationMinutes')::numeric<>trunc((p->>'durationMinutes')::numeric) or (p->>'durationMinutes')::integer not between 15 and 240 or jsonb_typeof(p->'jointMinutes') is distinct from 'number' or (p->>'jointMinutes')::numeric<>trunc((p->>'jointMinutes')::numeric) or (p->>'jointMinutes')::integer not between 1 and (p->>'durationMinutes')::integer or jsonb_typeof(p->'isDemo') is distinct from 'boolean' then return false;end if;
  foreach field in array array['title','name','location'] loop
   if jsonb_typeof(p->field) is distinct from 'object' or (select count(*) from jsonb_object_keys(p->field))<>2 then return false;end if;
   foreach l in array array['zh-CN','en-US'] loop if jsonb_typeof(p->field->l) is distinct from 'string' or length(p->field->>l)>(case when field='location' then 300 else 180 end) then return false;end if;end loop;
  end loop;
  foreach field in array array['free','childcare','transportAssistance'] loop if jsonb_typeof(p->'offers'->field) is distinct from 'boolean' then return false;end if;end loop;
  if jsonb_typeof(p->'organizer') is distinct from 'string' or length(p->>'organizer')>200 or jsonb_typeof(p->'officialUrl') is distinct from 'string' or length(p->>'officialUrl')>2000 or ((p->>'officialUrl')<>'' and (p->>'officialUrl') !~ '^https://[^[:space:]@]+$') or jsonb_typeof(p->'checkedAt') is distinct from 'string' or length(p->>'checkedAt')>10 then return false;end if;
 else return false;
 end if;
 return true;
exception when others then return false;
end $$;
create function public.together_mutate(action_name text,item jsonb,expected_version integer,checks jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.together_items;role_name text:=public.bloomie_role();p jsonb:=item->'data';rid text:=item->>'id';k text:=item->>'kind';l text;field text;v jsonb;
begin
 if role_name is null or action_name is null or action_name not in ('save','publish','unpublish','delete') or (action_name='save' and role_name not in ('admin','editor')) or (action_name in ('publish','unpublish') and role_name not in ('admin','reviewer')) or (action_name='delete' and role_name<>'admin') then raise exception 'Forbidden' using errcode='42501';end if;
 select * into r from public.together_items where id=rid for update;
 if found then if r.version is distinct from expected_version or r.deleted or r.kind is distinct from k then raise exception 'Conflict' using errcode='40001';end if;
 else if expected_version is distinct from 0 or action_name<>'save' then raise exception 'Conflict' using errcode='40001';end if;end if;
 if action_name='save' then
  if p->>'id' is distinct from rid or not public.together_valid(k,p) then raise exception 'Invalid content';end if;
  if k='activity' then p:=jsonb_set(p,'{reviewStatus}','"draft"');end if;
  if r.id is null then insert into public.together_items(id,kind,data,updated_by) values(rid,k,p,auth.uid()) returning * into r;
  else update public.together_items set data=p,version=version+1,updated_at=now(),updated_by=auth.uid() where id=rid returning * into r;end if;
 else
  p:=r.data;
  if action_name='publish' then
   if checks->'source' is distinct from 'true'::jsonb or checks->'rights' is distinct from 'true'::jsonb or checks->'professional' is distinct from 'true'::jsonb or not public.together_valid(r.kind,p) then raise exception 'Review required';end if;
   if r.kind='activity' then
    if coalesce(p->>'sourceUrl','') !~ '^https://[^[:space:]@]+$' or coalesce(length(trim(p->>'scopeNote')),0)=0 then raise exception 'Source and scope required';end if;
    foreach l in array array['zh-CN','en-US'] loop
     if coalesce(length(trim(p->'copy'->l->>'why')),0)=0 then raise exception 'Complete copy required';end if;
     for v in select value from jsonb_array_elements(p->'copy'->l->'steps') union all select value from jsonb_array_elements(p->'copy'->l->'materials') loop if length(trim(v#>>'{}'))=0 then raise exception 'Complete copy required';end if;end loop;
    end loop;
    p:=jsonb_set(p,'{reviewStatus}','"reviewed"');
   else
    foreach field in array array['title','name','location'] loop foreach l in array array['zh-CN','en-US'] loop if coalesce(length(trim(p->field->>l)),0)=0 then raise exception 'Complete bilingual fields required';end if;end loop;end loop;
    if not (p->>'isDemo')::boolean and (coalesce(length(trim(p->>'organizer')),0)=0 or coalesce(p->>'officialUrl','') !~ '^https://[^[:space:]@]+$' or coalesce(p->>'checkedAt','') !~ '^\d{4}-\d{2}-\d{2}$' or not isfinite((p->>'checkedAt')::date) or to_char((p->>'checkedAt')::date,'YYYY-MM-DD')<>p->>'checkedAt' or p->'location'->>'zh-CN' like '%待定%' or p->'location'->>'en-US' ilike '%to be confirmed%') then raise exception 'Confirmed organizer, location and source required';end if;
   end if;
  end if;
  update public.together_items set data=p,version=version+1,published=(action_name='publish'),deleted=(action_name='delete'),updated_at=now(),updated_by=auth.uid() where id=rid returning * into r;
  insert into public.together_publications(id,kind,data,version,active) values(rid,r.kind,case when action_name='publish' then p else '{}' end,r.version,action_name='publish') on conflict(id) do update set data=excluded.data,version=excluded.version,active=excluded.active,updated_at=now();
 end if;
 insert into public.together_audit(item_id,action,actor,version,checks) values(rid,action_name,auth.uid(),r.version,case when action_name='publish' then jsonb_build_object('source',true,'rights',true,'professional',true) else '{}' end);
 return to_jsonb(r);
end $$;
create function public.together_rsvp(target_event text,next_status text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.together_items;uid uuid:=auth.uid();begin
 if uid is null then raise exception 'Authentication required' using errcode='42501';end if;
 if next_status is null or next_status not in ('interested','cancelled') then raise exception 'Invalid status';end if;
 select * into r from public.together_items where id=target_event for update;
 if not found or r.kind<>'circle' or (next_status='interested' and (r.deleted or not exists(select 1 from public.together_publications where id=target_event and active))) then raise exception 'Circle unavailable';end if;
 insert into public.together_registrations(event_id,user_id,status) values(target_event,uid,next_status) on conflict(event_id,user_id) do update set status=excluded.status,updated_at=now();
 return jsonb_build_object('event_id',target_event,'status',next_status);
end $$;
create function public.together_registration_counts() returns table(event_id text,interested integer,cancelled integer) language plpgsql security definer set search_path='' as $$
begin
 if public.bloomie_role() is null then raise exception 'Forbidden' using errcode='42501';end if;
 return query select e.id,count(r.user_id) filter(where r.status='interested')::integer,count(r.user_id) filter(where r.status='cancelled')::integer from public.together_items e left join public.together_registrations r on r.event_id=e.id where e.kind='circle' group by e.id;
end $$;
create function public.together_registration_list() returns table(event_id text,user_id uuid,status text,created_at timestamptz,updated_at timestamptz,email text) language plpgsql security definer set search_path='' as $$
begin
 if public.bloomie_role() is distinct from 'admin' then raise exception 'Forbidden' using errcode='42501';end if;
 return query select r.event_id,r.user_id,r.status,r.created_at,r.updated_at,u.email::text from public.together_registrations r join auth.users u on u.id=r.user_id order by r.updated_at desc limit 1000;
end $$;
revoke all on function public.together_mutate(text,jsonb,integer,jsonb),public.together_rsvp(text,text),public.together_registration_counts(),public.together_registration_list() from public,anon;
grant execute on function public.together_mutate(text,jsonb,integer,jsonb),public.together_rsvp(text,text),public.together_registration_counts(),public.together_registration_list() to authenticated;
