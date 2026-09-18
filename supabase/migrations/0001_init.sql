-- =========================================================
-- B&R Recreación e Inflables — esquema inicial
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- products: catálogo de juegos/servicios
-- ---------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_ars numeric(12, 2),
  price_original_ars numeric(12, 2),
  image_urls text[] not null default '{}',
  is_bookable boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_active_idx on products (is_active, sort_order);

-- ---------------------------------------------------------
-- availability_blocks: fechas NO disponibles.
-- product_id null = bloqueo general (aplica a todo el negocio).
-- Toda fecha futura sin bloqueo se considera disponible.
-- ---------------------------------------------------------
create table if not exists availability_blocks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products (id) on delete cascade,
  blocked_date date not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists availability_blocks_lookup_idx
  on availability_blocks (product_id, blocked_date);

-- Evita cargar el mismo bloqueo dos veces para el mismo producto/fecha.
-- (Los bloqueos generales, con product_id null, se controlan aparte.)
create unique index if not exists availability_blocks_unique_product_date
  on availability_blocks (product_id, blocked_date)
  where product_id is not null;

-- ---------------------------------------------------------
-- booking_requests: solicitudes de reserva desde la web.
-- Al pasar a 'confirmada' desde el admin, se crea el bloqueo
-- correspondiente en availability_blocks (lo hace la acción del
-- backoffice, no un trigger, para mantenerlo simple y explícito).
-- ---------------------------------------------------------
create table if not exists booking_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete restrict,
  requested_date date not null,
  customer_name text not null,
  customer_phone text not null,
  event_location text,
  notes text,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'confirmada', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_requests_status_idx
  on booking_requests (status, requested_date);

-- ---------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

drop trigger if exists booking_requests_set_updated_at on booking_requests;
create trigger booking_requests_set_updated_at
  before update on booking_requests
  for each row execute function set_updated_at();

-- ---------------------------------------------------------
-- RLS: lectura pública de catálogo/disponibilidad activa,
-- escritura solo con la service role key (usada desde el
-- servidor: server actions del admin y del formulario público).
-- ---------------------------------------------------------
alter table products enable row level security;
alter table availability_blocks enable row level security;
alter table booking_requests enable row level security;

create policy "products_public_read" on products
  for select using (is_active = true);

create policy "availability_public_read" on availability_blocks
  for select using (true);

-- No hay policy de INSERT/UPDATE/DELETE para el rol anon a propósito:
-- toda escritura (crear producto, bloquear fecha, cambiar estado de
-- una reserva, crear una reserva) pasa por Server Actions que usan
-- la service role key en el servidor, nunca desde el navegador.
