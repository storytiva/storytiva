create table public.book_node_positions (
  node_id uuid primary key references public.book_nodes(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  cursor_position integer not null default 0 check (cursor_position >= 0),
  updated_at timestamptz not null default now()
);

create index book_node_positions_book_idx on public.book_node_positions (book_id);

alter table public.book_node_positions enable row level security;

create policy "Owners manage chapter positions" on public.book_node_positions for all to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.books b
      where b.id = book_id and b.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.book_nodes n
      where n.id = public.book_node_positions.node_id and n.book_id = public.book_node_positions.book_id
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.books b
      where b.id = book_id and b.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.book_nodes n
      where n.id = public.book_node_positions.node_id and n.book_id = public.book_node_positions.book_id
    )
  );

grant select, insert, update, delete on public.book_node_positions to authenticated;

create or replace function public.create_book_chapter(
  target_book_id uuid,
  chapter_title text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_position integer;
  new_chapter_id uuid;
  safe_title text;
begin
  perform 1
  from public.books b
  where b.id = target_book_id and b.owner_id = auth.uid()
  for update;

  if not found then raise exception 'Book not found'; end if;

  select coalesce(max(n.position), -1) + 1 into next_position
  from public.book_nodes n
  where n.book_id = target_book_id;

  safe_title := coalesce(nullif(left(trim(chapter_title), 200), ''), 'New chapter');

  insert into public.book_nodes(book_id, kind, title, position)
  values (target_book_id, 'chapter', safe_title, next_position)
  returning id into new_chapter_id;

  insert into public.book_node_positions(node_id, book_id, owner_id, cursor_position, updated_at)
  values (new_chapter_id, target_book_id, auth.uid(), 0, now())
  on conflict (node_id) do update set cursor_position = 0, updated_at = now();

  insert into public.book_positions(book_id, owner_id, node_id, cursor_position, updated_at)
  values (target_book_id, auth.uid(), new_chapter_id, 0, now())
  on conflict (book_id) do update
    set owner_id = excluded.owner_id,
        node_id = excluded.node_id,
        cursor_position = 0,
        updated_at = now();

  update public.books set updated_at = now() where id = target_book_id;
  return new_chapter_id;
end;
$$;

create or replace function public.move_book_chapter(
  target_chapter_id uuid,
  move_direction text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  parent_book_id uuid;
  current_position integer;
  neighbor_id uuid;
  neighbor_position integer;
  temporary_position integer;
begin
  if move_direction not in ('up', 'down') then raise exception 'Invalid direction'; end if;

  select n.book_id into parent_book_id
  from public.book_nodes n
  join public.books b on b.id = n.book_id
  where n.id = target_chapter_id and n.kind = 'chapter' and b.owner_id = auth.uid();

  if parent_book_id is null then raise exception 'Chapter not found'; end if;

  perform 1 from public.books b
  where b.id = parent_book_id and b.owner_id = auth.uid()
  for update;

  select n.position into current_position
  from public.book_nodes n
  where n.id = target_chapter_id and n.book_id = parent_book_id and n.kind = 'chapter'
  for update;

  if move_direction = 'up' then
    select n.id, n.position into neighbor_id, neighbor_position
    from public.book_nodes n
    where n.book_id = parent_book_id and n.kind = 'chapter' and n.position < current_position
    order by n.position desc limit 1 for update;
  else
    select n.id, n.position into neighbor_id, neighbor_position
    from public.book_nodes n
    where n.book_id = parent_book_id and n.kind = 'chapter' and n.position > current_position
    order by n.position asc limit 1 for update;
  end if;

  if neighbor_id is null then return false; end if;

  select min(n.position) - 1 into temporary_position
  from public.book_nodes n where n.book_id = parent_book_id;

  update public.book_nodes set position = temporary_position where id = target_chapter_id;
  update public.book_nodes set position = current_position where id = neighbor_id;
  update public.book_nodes set position = neighbor_position where id = target_chapter_id;
  update public.books set updated_at = now() where id = parent_book_id;

  return true;
end;
$$;

revoke all on function public.create_book_chapter(uuid, text) from public;
revoke all on function public.move_book_chapter(uuid, text) from public;
grant execute on function public.create_book_chapter(uuid, text) to authenticated;
grant execute on function public.move_book_chapter(uuid, text) to authenticated;
