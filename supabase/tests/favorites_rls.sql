-- Manual integration test, after applying the migration in a test project.
-- Supply two existing auth user UUIDs below. Entire script is rolled back.
-- Do not substitute production participants or use this as a real data import.
begin;
-- Example UUIDs must be replaced with actual test users.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.favorites(user_id, article_id)
values ('11111111-1111-1111-1111-111111111111', 'pause');
do $$ begin
  if (select count(*) from public.favorites) <> 1 then raise exception 'owner read failed'; end if;
end $$;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
do $$ begin
  if exists(select 1 from public.favorites) then raise exception 'cross-user read'; end if;
  begin
    insert into public.favorites(user_id, article_id) values ('11111111-1111-1111-1111-111111111111', 'listen');
    raise exception 'cross-user insert unexpectedly allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
delete from public.favorites where user_id = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
do $$ begin
  if (select count(*) from public.favorites) <> 1 then raise exception 'cross-user deletion changed owner data'; end if;
end $$;
rollback;
