create table if not exists public.user_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state_json jsonb not null,
  source_device_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_user_snapshots_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_user_snapshots_updated_at on public.user_snapshots;
create trigger trg_user_snapshots_updated_at
before update on public.user_snapshots
for each row
execute function public.set_user_snapshots_updated_at();

alter table public.user_snapshots enable row level security;

drop policy if exists "user_snapshots_select_own" on public.user_snapshots;
create policy "user_snapshots_select_own"
on public.user_snapshots
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_snapshots_insert_own" on public.user_snapshots;
create policy "user_snapshots_insert_own"
on public.user_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_snapshots_update_own" on public.user_snapshots;
create policy "user_snapshots_update_own"
on public.user_snapshots
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_snapshots_delete_own" on public.user_snapshots;
create policy "user_snapshots_delete_own"
on public.user_snapshots
for delete
to authenticated
using (auth.uid() = user_id);
