-- Run after the first two migrations. Extend allowed book IDs without changing RLS.
alter table public.favorites drop constraint if exists favorites_article_id_check;
alter table public.favorites add constraint favorites_article_id_check
  check (article_id in (
    'pause', 'listen', 'boundaries', 'together',
    'research-reading', 'research-sleep', 'research-stress',
    'research-screen', 'research-responsive'
  ));
