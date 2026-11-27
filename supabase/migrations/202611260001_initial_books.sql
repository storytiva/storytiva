create extension if not exists pgcrypto;

create table public.books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled book' check (char_length(title) between 1 and 200),
  language text not null default 'en' check (language in ('en','es')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.book_nodes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  kind text not null default 'chapter' check (kind in ('chapter','note')),
  title text not null default 'Chapter 1',
  position integer not null default 0,
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  unique (book_id, position)
);

create table public.book_positions (
  book_id uuid primary key references public.books(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  node_id uuid references public.book_nodes(id) on delete set null,
  cursor_position integer not null default 0 check (cursor_position >= 0),
  updated_at timestamptz not null default now()
);

create table public.book_versions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  node_id uuid not null references public.book_nodes(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  revision bigint not null,
  title text not null,
  content jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.books enable row level security;
alter table public.book_nodes enable row level security;
alter table public.book_positions enable row level security;
alter table public.book_versions enable row level security;

create policy "Owners manage books" on public.books for all to authenticated
 using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Owners manage book nodes" on public.book_nodes for all to authenticated
 using (exists (select 1 from public.books b where b.id = book_id and b.owner_id = (select auth.uid())))
 with check (exists (select 1 from public.books b where b.id = book_id and b.owner_id = (select auth.uid())));
create policy "Owners manage book positions" on public.book_positions for all to authenticated
 using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()) and exists (select 1 from public.books b where b.id = book_id and b.owner_id = (select auth.uid())));
create policy "Owners manage book versions" on public.book_versions for all to authenticated
 using (created_by = (select auth.uid()) and exists (select 1 from public.books b where b.id = book_id and b.owner_id = (select auth.uid())))
 with check (created_by = (select auth.uid()) and exists (select 1 from public.books b where b.id = book_id and b.owner_id = (select auth.uid())));

grant select, insert, update, delete on public.books, public.book_nodes, public.book_positions, public.book_versions to authenticated;

create or replace function public.create_book_with_first_chapter(book_title text, book_language text default 'en')
returns uuid language plpgsql security invoker set search_path = ''
as $$
declare new_book_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.books(owner_id,title,language) values (auth.uid(), coalesce(nullif(trim(book_title),''),'Untitled book'), case when book_language = 'es' then 'es' else 'en' end) returning id into new_book_id;
  insert into public.book_nodes(book_id,kind,title,position) values (new_book_id,'chapter','Chapter 1',0);
  insert into public.book_positions(book_id,owner_id,node_id,cursor_position) select new_book_id,auth.uid(),id,0 from public.book_nodes where book_id = new_book_id limit 1;
  return new_book_id;
end $$;

create or replace function public.recover_book_node(target_node_id uuid, expected_revision bigint, recovered_content jsonb)
returns bigint language plpgsql security invoker set search_path = ''
as $$
declare current_revision bigint; current_title text; current_content jsonb; parent_book uuid;
begin
  select n.revision,n.title,n.content,n.book_id into current_revision,current_title,current_content,parent_book
  from public.book_nodes n join public.books b on b.id=n.book_id
  where n.id=target_node_id and b.owner_id=auth.uid() for update of n;
  if current_revision is null then raise exception 'Node not found'; end if;
  if current_revision <> expected_revision then raise exception 'REVISION_CONFLICT'; end if;
  insert into public.book_versions(book_id,node_id,created_by,revision,title,content)
  values (parent_book,target_node_id,auth.uid(),current_revision,current_title,current_content);
  update public.book_nodes set content=recovered_content,revision=current_revision+1,updated_at=now() where id=target_node_id;
  update public.books set updated_at=now() where id=parent_book;
  return current_revision+1;
end $$;

revoke all on function public.create_book_with_first_chapter(text,text) from public;
revoke all on function public.recover_book_node(uuid,bigint,jsonb) from public;
grant execute on function public.create_book_with_first_chapter(text,text) to authenticated;
grant execute on function public.recover_book_node(uuid,bigint,jsonb) to authenticated;
