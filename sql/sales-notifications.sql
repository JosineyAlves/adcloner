-- Notificações de venda (H&W via postback + Web Push). Remover com sql/sales-notifications-remove.sql
-- Todas as tabelas: RLS ligado e SEM policies (só o service_role acessa, via lib/supabase-admin.ts).

-- Token secreto por usuário, usado na URL do postback (/api/postbacks/hw/<token>).
create table if not exists public.hw_integrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);
alter table public.hw_integrations enable row level security;

-- Vendas recebidas. Sem dados pessoais do comprador. Idempotente por (user_id, order_number).
create table if not exists public.hw_sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_number text not null,
  received_at timestamptz not null default now(),
  currency text,
  commission_cents bigint,
  payout_raw text,
  product_name text,
  campaign_id text,
  campaign_name text,
  adset_id text,
  adset_name text,
  ad_id text,
  ad_name text,
  placement text,
  is_test boolean not null default false,
  raw jsonb,
  unique (user_id, order_number)
);
create index if not exists hw_sales_user_received_idx on public.hw_sales (user_id, received_at desc);
alter table public.hw_sales enable row level security;

-- Aparelhos que ativaram o push (uma linha por navegador/PWA).
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_success_at timestamptz
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;

-- Registro de TUDO que chega no postback (inclusive eventos ignorados), para entender o formato
-- real da H&W. Sem dados pessoais (mesmo filtro do hw_sales.raw).
create table if not exists public.hw_postback_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  received_at timestamptz not null default now(),
  method text,
  content_type text,
  user_agent text,
  event_type text,
  order_number text,
  outcome text not null,
  payload jsonb
);
create index if not exists hw_postback_log_user_received_idx on public.hw_postback_log (user_id, received_at desc);
alter table public.hw_postback_log enable row level security;

-- Corpo completo do postback (inclusive dados pessoais), só lido pelo servidor. Base futura da Conversions API.
alter table public.hw_postback_log add column if not exists payload_full jsonb;
alter table public.hw_sales add column if not exists raw_full jsonb;
