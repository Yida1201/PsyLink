-- Separate daily voice allowance. No audio or conversation is stored.
create table if not exists public.speech_quota (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  calls integer not null default 0 check (calls >= 0),
  primary key (user_id, day)
);
alter table public.speech_quota enable row level security;
revoke all on public.speech_quota from anon, authenticated;
create or replace function public.consume_speech_quota()
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare count_now integer;
begin
  if auth.uid() is null then return false; end if;
  insert into public.speech_quota (user_id, day, calls) values (auth.uid(), current_date, 1)
  on conflict (user_id, day) do update set calls = speech_quota.calls + 1 where speech_quota.calls < 20
  returning calls into count_now;
  return count_now is not null;
end;
$$;
revoke all on function public.consume_speech_quota() from public, anon;
grant execute on function public.consume_speech_quota() to authenticated;
