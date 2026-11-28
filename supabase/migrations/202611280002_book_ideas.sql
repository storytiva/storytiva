create table public.book_ideas (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  status text not null default 'inbox' check (status in ('inbox', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index book_ideas_book_status_created_idx
  on public.book_ideas (book_id, status, created_at desc);

alter table public.book_ideas enable row level security;

create policy "Owners manage book ideas" on public.book_ideas for all to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.books b
      where b.id = book_id and b.owner_id = (select auth.uid())
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.books b
      where b.id = book_id and b.owner_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.book_ideas to authenticated;
