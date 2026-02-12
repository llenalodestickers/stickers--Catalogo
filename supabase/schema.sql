create extension if not exists pgcrypto;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  whatsapp text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  total numeric(12,2) not null default 0,
  estado text not null default 'nuevo',
  canal text not null default 'whatsapp',
  created_at timestamptz not null default now()
);

create table if not exists public.pedido_items (
  id bigint generated always as identity primary key,
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  producto_id text not null,
  codigo text not null,
  cantidad integer not null check (cantidad > 0),
  precio numeric(12,2) not null,
  subtotal numeric(12,2) not null,
  imagen text,
  created_at timestamptz not null default now()
);

create index if not exists idx_pedidos_cliente on public.pedidos(cliente_id);
create index if not exists idx_items_pedido on public.pedido_items(pedido_id);
create index if not exists idx_pedidos_created_at on public.pedidos(created_at desc);

alter table public.clientes enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;

drop policy if exists clientes_insert_anon on public.clientes;
create policy clientes_insert_anon on public.clientes
for insert to anon
with check (true);

drop policy if exists clientes_select_anon on public.clientes;
create policy clientes_select_anon on public.clientes
for select to anon
using (true);

drop policy if exists clientes_update_anon on public.clientes;
create policy clientes_update_anon on public.clientes
for update to anon
using (true)
with check (true);

drop policy if exists pedidos_insert_anon on public.pedidos;
create policy pedidos_insert_anon on public.pedidos
for insert to anon
with check (true);

drop policy if exists pedidos_select_anon on public.pedidos;
create policy pedidos_select_anon on public.pedidos
for select to anon
using (true);

drop policy if exists pedidos_update_anon on public.pedidos;
create policy pedidos_update_anon on public.pedidos
for update to anon
using (true)
with check (true);

drop policy if exists pedido_items_insert_anon on public.pedido_items;
create policy pedido_items_insert_anon on public.pedido_items
for insert to anon
with check (true);

drop policy if exists pedido_items_select_anon on public.pedido_items;
create policy pedido_items_select_anon on public.pedido_items
for select to anon
using (true);
