alter table public.book_versions
  add column label text,
  add column source text not null default 'recovery'
    check (source in ('autosave', 'manual', 'restore', 'recovery'));

create index book_versions_node_created_idx
  on public.book_versions (node_id, created_at desc);

create or replace function public.save_book_node(
  target_node_id uuid,
  expected_revision bigint,
  new_content jsonb
)
returns table (revision bigint, snapshot_created boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_revision bigint;
  current_title text;
  current_content jsonb;
  parent_book uuid;
  last_snapshot_at timestamptz;
  did_snapshot boolean := false;
begin
  select n.revision, n.title, n.content, n.book_id
    into current_revision, current_title, current_content, parent_book
  from public.book_nodes n
  join public.books b on b.id = n.book_id
  where n.id = target_node_id and b.owner_id = auth.uid()
  for update of n;

  if current_revision is null then raise exception 'Node not found'; end if;
  if current_revision <> expected_revision then raise exception 'REVISION_CONFLICT'; end if;

  select v.created_at into last_snapshot_at
  from public.book_versions v
  where v.node_id = target_node_id
  order by v.created_at desc
  limit 1;

  if last_snapshot_at is null or last_snapshot_at <= now() - interval '15 minutes' then
    insert into public.book_versions(book_id, node_id, created_by, revision, title, content, source)
    values (parent_book, target_node_id, auth.uid(), current_revision, current_title, current_content, 'autosave');
    did_snapshot := true;
  end if;

  update public.book_nodes
  set content = new_content, revision = current_revision + 1, updated_at = now()
  where id = target_node_id;

  update public.books set updated_at = now() where id = parent_book;
  return query select current_revision + 1, did_snapshot;
end;
$$;

create or replace function public.create_book_node_version(
  target_node_id uuid,
  version_label text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_revision bigint;
  current_title text;
  current_content jsonb;
  parent_book uuid;
  new_version_id uuid;
begin
  select n.revision, n.title, n.content, n.book_id
    into current_revision, current_title, current_content, parent_book
  from public.book_nodes n
  join public.books b on b.id = n.book_id
  where n.id = target_node_id and b.owner_id = auth.uid()
  for update of n;

  if current_revision is null then raise exception 'Node not found'; end if;

  insert into public.book_versions(book_id, node_id, created_by, revision, title, content, source, label)
  values (
    parent_book, target_node_id, auth.uid(), current_revision, current_title, current_content,
    'manual', coalesce(nullif(left(trim(version_label), 120), ''), 'Hito manual')
  )
  returning id into new_version_id;

  return new_version_id;
end;
$$;

create or replace function public.restore_book_node_version(target_version_id uuid)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_node_id uuid;
  target_book_id uuid;
  target_revision bigint;
  target_title text;
  target_content jsonb;
  current_revision bigint;
  current_title text;
  current_content jsonb;
begin
  select v.node_id, v.book_id, v.revision, v.title, v.content
    into target_node_id, target_book_id, target_revision, target_title, target_content
  from public.book_versions v
  join public.books b on b.id = v.book_id
  where v.id = target_version_id and b.owner_id = auth.uid();

  if target_node_id is null then raise exception 'Version not found'; end if;

  select n.revision, n.title, n.content
    into current_revision, current_title, current_content
  from public.book_nodes n
  where n.id = target_node_id and n.book_id = target_book_id
  for update;

  if current_revision is null then raise exception 'Node not found'; end if;
  if current_content = target_content then return current_revision; end if;

  insert into public.book_versions(book_id, node_id, created_by, revision, title, content, source, label)
  values (target_book_id, target_node_id, auth.uid(), current_revision, current_title, current_content, 'restore', 'Antes de restaurar');

  update public.book_nodes
  set content = target_content, title = target_title, revision = current_revision + 1, updated_at = now()
  where id = target_node_id;

  update public.books set updated_at = now() where id = target_book_id;
  return current_revision + 1;
end;
$$;

revoke all on function public.save_book_node(uuid, bigint, jsonb) from public;
revoke all on function public.create_book_node_version(uuid, text) from public;
revoke all on function public.restore_book_node_version(uuid) from public;
grant execute on function public.save_book_node(uuid, bigint, jsonb) to authenticated;
grant execute on function public.create_book_node_version(uuid, text) to authenticated;
grant execute on function public.restore_book_node_version(uuid) to authenticated;
