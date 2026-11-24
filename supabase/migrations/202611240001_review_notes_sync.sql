begin;

create schema if not exists review_notes_private;
revoke all on schema review_notes_private from public, anon, authenticated;

create table if not exists review_notes_private.notebooks (
  key_hash bytea primary key,
  revision integer not null check (revision > 0),
  snapshot text not null check (length(snapshot) between 40 and 6000000)
);
alter table review_notes_private.notebooks enable row level security;
revoke all on review_notes_private.notebooks from public, anon, authenticated;

create or replace function public.review_notes_sync(
  p_key text, p_revision integer, p_snapshot text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  notebook_key bytea;
  current_revision integer;
  current_snapshot text;
begin
  if p_key is null or p_key !~ '^[0-9a-f]{64}$'
     or p_revision is null or p_revision < 0
     or (p_snapshot is not null and length(p_snapshot) not between 40 and 6000000) then
    raise exception 'Invalid sync request' using errcode = '22023';
  end if;

  notebook_key := pg_catalog.sha256(pg_catalog.convert_to(p_key, 'UTF8'));

  if p_snapshot is not null then
    if p_revision = 0 then
      insert into review_notes_private.notebooks as n (key_hash, revision, snapshot)
      values (notebook_key, 1, p_snapshot)
      on conflict (key_hash) do nothing
      returning n.revision into current_revision;
    else
      update review_notes_private.notebooks as n
      set snapshot = p_snapshot, revision = n.revision + 1
      where n.key_hash = notebook_key and n.revision = p_revision
      returning n.revision into current_revision;
    end if;

    if found then
      return jsonb_build_object('revision', current_revision, 'saved', true);
    end if;
  end if;

  select n.revision, n.snapshot into current_revision, current_snapshot
  from review_notes_private.notebooks as n
  where n.key_hash = notebook_key;

  if not found then
    return null;
  end if;
  if p_snapshot is null and p_revision = current_revision then
    return jsonb_build_object('revision', current_revision);
  end if;
  return jsonb_build_object('revision', current_revision, 'snapshot', current_snapshot);
end;
$$;

revoke all on function public.review_notes_sync(text, integer, text) from public, anon, authenticated;
grant execute on function public.review_notes_sync(text, integer, text) to anon;

notify pgrst, 'reload schema';
commit;
