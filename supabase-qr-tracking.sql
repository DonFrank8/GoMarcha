-- Creates a lightweight source tracking table for QR attribution.
create table if not exists public.qr_tracking (
  id bigint generated always as identity primary key,
  source text not null,
  created_at timestamptz not null default now()
);

alter table public.qr_tracking enable row level security;

grant insert on public.qr_tracking to anon, authenticated;

do $$
declare
  seq_name text;
begin
  seq_name := pg_get_serial_sequence('public.qr_tracking', 'id');
  if seq_name is not null then
    execute format('grant usage, select on sequence %s to anon, authenticated', seq_name);
  end if;
end
$$;

drop policy if exists "Allow public insert qr tracking" on public.qr_tracking;
create policy "Allow public insert qr tracking"
on public.qr_tracking
for insert
to anon, authenticated
with check (true);
