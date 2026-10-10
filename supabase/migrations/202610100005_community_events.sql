-- Apply after 004. RSVP is Bloomie participation interest, never organizer enrollment.
create table public.community_events(id text primary key check(id ~ '^[a-zA-Z0-9_-]{1,100}$'),data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<40000),version integer not null default 1,published boolean not null default false,deleted boolean not null default false,updated_at timestamptz not null default now(),updated_by uuid references auth.users(id));
create table public.community_event_publications(id text primary key references public.community_events(id),data jsonb not null,version integer not null,active boolean not null,updated_at timestamptz not null default now());
create table public.community_registrations(event_id text references public.community_events(id),user_id uuid references auth.users(id) on delete cascade,status text not null check(status in ('interested','cancelled')),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),primary key(event_id,user_id));
create table public.community_event_audit(id uuid primary key default gen_random_uuid(),event_id text not null,action text not null,actor uuid references auth.users(id) on delete set null,version integer not null,created_at timestamptz not null default now());
alter table public.community_events enable row level security;
alter table public.community_event_publications enable row level security;
alter table public.community_registrations enable row level security;
alter table public.community_event_audit enable row level security;
create policy event_staff_read on public.community_events for select to authenticated using((select public.bloomie_role()) in ('admin','editor','reviewer'));
create policy event_public_read on public.community_event_publications for select to anon,authenticated using(active);
create policy registration_owner_read on public.community_registrations for select to authenticated using(user_id=(select auth.uid()) or (select public.bloomie_role())='admin');
create policy event_audit_staff_read on public.community_event_audit for select to authenticated using((select public.bloomie_role()) in ('admin','editor','reviewer'));
revoke all on public.community_events,public.community_registrations,public.community_event_audit from anon;
grant select on public.community_events,public.community_registrations,public.community_event_audit to authenticated;
grant select on public.community_event_publications to anon,authenticated;
revoke insert,update,delete on public.community_events,public.community_event_publications,public.community_registrations,public.community_event_audit from anon,authenticated;
create function public.community_event_mutate(action_name text,item jsonb,expected_version integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.community_events; role_name text:=public.bloomie_role();p jsonb:=item->'data';rid text:=item->>'id';part record;
begin
 if role_name is null or action_name not in ('save','publish','unpublish','delete') or (action_name='save' and role_name not in ('admin','editor')) or (action_name in ('publish','unpublish') and role_name not in ('admin','reviewer')) or (action_name='delete' and role_name<>'admin') then raise exception 'Forbidden' using errcode='42501';end if;
 select * into r from public.community_events where id=rid for update;
 if found then
  if r.version is distinct from expected_version or r.deleted then raise exception 'Conflict' using errcode='40001';end if;
 else
  if expected_version is distinct from 0 or action_name<>'save' then raise exception 'Conflict' using errcode='40001';end if;
 end if;
 if action_name='save' then
  if jsonb_typeof(p->'copy') is distinct from 'object' or coalesce(length(trim(p->'copy'->'en-US'->>'title')),0)=0 or coalesce(p->>'category','') not in ('arts','community','reading') or coalesce(p->>'color','') not in ('sage','sand','clay','blue') or jsonb_typeof(p->'annual') is distinct from 'boolean' or jsonb_typeof(p->'nextDateConfirmed') is distinct from 'boolean' or jsonb_typeof(p->'organizer') is distinct from 'string' or length(p->>'organizer')>200 or jsonb_typeof(p->'officialUrl') is distinct from 'string' or ((p->>'officialUrl')<>'' and (p->>'officialUrl') !~ '^https://[^[:space:]]+$') or jsonb_typeof(p->'checkedAt') is distinct from 'string' or length(p->>'checkedAt')>10 then raise exception 'Invalid event';end if;
  for part in select key,value from jsonb_each(p->'copy') loop
   if part.key not in ('zh-CN','en-US','es','ja','ko') or jsonb_typeof(part.value->'title') is distinct from 'string' or length(part.value->>'title')>180 or jsonb_typeof(part.value->'description') is distinct from 'string' or length(part.value->>'description')>2000 or jsonb_typeof(part.value->'schedule') is distinct from 'string' or length(part.value->>'schedule')>300 or jsonb_typeof(part.value->'venue') is distinct from 'string' or length(part.value->>'venue')>300 then raise exception 'Invalid event copy';end if;
  end loop;
  if r.id is null then insert into public.community_events(id,data,updated_by) values(rid,p,auth.uid()) returning * into r;
  else update public.community_events set data=p,version=version+1,updated_at=now(),updated_by=auth.uid() where id=rid returning * into r;end if;
 else
  if action_name='publish' then
   p:=r.data;
   if coalesce(length(trim(p->>'organizer')),0)=0 or coalesce(p->>'officialUrl','') !~ '^https://[^[:space:]]+$' or coalesce(p->>'checkedAt','') !~ '^\d{4}-\d{2}-\d{2}$' or coalesce(length(trim(p->'copy'->'en-US'->>'description')),0)=0 or coalesce(length(trim(p->'copy'->'en-US'->>'schedule')),0)=0 or coalesce(length(trim(p->'copy'->'en-US'->>'venue')),0)=0 then raise exception 'Official source, verification date and complete copy required';end if;
   for part in select key,value from jsonb_each(p->'copy') loop
    if coalesce(length(trim(part.value->>'title')),0)=0 or coalesce(length(trim(part.value->>'description')),0)=0 or coalesce(length(trim(part.value->>'schedule')),0)=0 or coalesce(length(trim(part.value->>'venue')),0)=0 then raise exception 'Complete each translation or remove it';end if;
   end loop;
  end if;
  update public.community_events set version=version+1,published=(action_name='publish'),deleted=(action_name='delete'),updated_at=now(),updated_by=auth.uid() where id=rid returning * into r;
  insert into public.community_event_publications(id,data,version,active) values(rid,case when action_name='publish' then r.data else '{}'::jsonb end,r.version,action_name='publish') on conflict(id) do update set data=excluded.data,version=excluded.version,active=excluded.active,updated_at=now();
 end if;
 insert into public.community_event_audit(event_id,action,actor,version) values(rid,action_name,auth.uid(),r.version);
 return to_jsonb(r);
end $$;
create function public.community_rsvp(target_event text,next_status text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.community_events;reg public.community_registrations;uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Authentication required' using errcode='42501';end if;
 if next_status not in ('interested','cancelled') or next_status is null then raise exception 'Invalid status';end if;
 select * into r from public.community_events where id=target_event for update;
 if not found or (next_status='interested' and (r.deleted or not exists(select 1 from public.community_event_publications where id=target_event and active))) then raise exception 'Event unavailable';end if;
 insert into public.community_registrations(event_id,user_id,status) values(target_event,uid,next_status) on conflict(event_id,user_id) do update set status=excluded.status,updated_at=now() returning * into reg;
 return jsonb_build_object('event_id',reg.event_id,'status',reg.status);
end $$;
create function public.community_registration_counts() returns table(event_id text,interested integer,cancelled integer) language plpgsql security definer set search_path='' as $$
begin
 if public.bloomie_role() is null then raise exception 'Forbidden' using errcode='42501';end if;
 return query select e.id,count(r.user_id) filter(where r.status='interested')::integer,count(r.user_id) filter(where r.status='cancelled')::integer from public.community_events e left join public.community_registrations r on r.event_id=e.id group by e.id;
end $$;
create function public.community_registration_list() returns table(event_id text,user_id uuid,status text,created_at timestamptz,updated_at timestamptz,email text) language plpgsql security definer set search_path='' as $$
begin
 if public.bloomie_role() is distinct from 'admin' then raise exception 'Forbidden' using errcode='42501';end if;
 return query select r.event_id,r.user_id,r.status,r.created_at,r.updated_at,u.email::text from public.community_registrations r join auth.users u on u.id=r.user_id order by r.updated_at desc limit 1000;
end $$;
revoke all on function public.community_event_mutate(text,jsonb,integer),public.community_rsvp(text,text),public.community_registration_counts(),public.community_registration_list() from public,anon;
grant execute on function public.community_event_mutate(text,jsonb,integer),public.community_rsvp(text,text),public.community_registration_counts(),public.community_registration_list() to authenticated;
