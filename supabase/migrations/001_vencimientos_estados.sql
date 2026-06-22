-- Tabla para persistir estado, fecha de presentación y notas de cada vencimiento por cliente
create table if not exists vencimientos_estados (
  id uuid primary key default gen_random_uuid(),
  cliente_id text not null,
  event_id text not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'proximo', 'presentado', 'vencido')),
  fecha_presentacion date,
  nota text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (cliente_id, event_id)
);

alter table vencimientos_estados enable row level security;

create policy "authenticated users can manage estados"
  on vencimientos_estados for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger vencimientos_estados_updated_at
  before update on vencimientos_estados
  for each row execute function update_updated_at();
