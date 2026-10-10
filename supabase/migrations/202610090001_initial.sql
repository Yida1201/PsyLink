-- Apply in a dedicated Supabase project. No child identities or chat content.
create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id text not null check (article_id in ('pause', 'listen', 'boundaries', 'together')),
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);
alter table public.favorites enable row level security;
create policy "read own favorites" on public.favorites for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own favorites" on public.favorites for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own favorites" on public.favorites for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own favorites" on public.favorites for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.favorites from anon;
grant select, insert, update, delete on public.favorites to authenticated;

create table public.chat_quota (
  user_id uuid not null references auth.users(id) on delete cascade,
  quota_day date not null default current_date,
  calls integer not null default 0,
  primary key (user_id, quota_day)
);
alter table public.chat_quota enable row level security;
revoke all on public.chat_quota from anon, authenticated;
-- Callable by authenticated users only; callers cannot choose another user.
create function public.consume_chat_quota() returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_calls integer;
begin
  if auth.uid() is null then return false; end if;
  insert into public.chat_quota (user_id, quota_day, calls)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, quota_day) do update
  set calls = public.chat_quota.calls + 1 where public.chat_quota.calls < 30
  returning calls into v_calls;
  return v_calls is not null;
end;
$$;
revoke all on function public.consume_chat_quota() from public, anon;
grant execute on function public.consume_chat_quota() to authenticated;
