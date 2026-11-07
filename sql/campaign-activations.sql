-- Ativação agendada de campanhas (recurso experimental). Remover com sql/campaign-activations-remove.sql
create table if not exists public.campaign_activations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meta_campaign_id text not null,
  meta_account_id text not null,
  campaign_name text,
  activate_time time not null,
  days_of_week smallint[] not null default '{0,1,2,3,4,5,6}',
  enabled boolean not null default true,
  last_run_date date,
  last_run_at timestamptz,
  last_result text,
  last_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, meta_campaign_id)
);
-- Só o service_role acessa (sem policies = anon/authenticated bloqueados).
alter table public.campaign_activations enable row level security;

-- Histórico de execuções (1 linha por tentativa do cron).
create table if not exists public.campaign_activation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activation_id uuid,
  meta_campaign_id text not null,
  campaign_name text,
  ran_at timestamptz not null default now(),
  result text not null,
  message text
);
create index if not exists campaign_activation_runs_user_ran_idx on public.campaign_activation_runs (user_id, ran_at desc);
alter table public.campaign_activation_runs enable row level security;

-- Job (rodar depois de criar o segredo no Vault com nome campaign_activations_cron_secret):
-- select cron.schedule('campaign-activations-runner', '*/5 * * * *', $$
--   select net.http_post(
--     url := 'https://adcloner.vercel.app/api/cron/campaign-activations',
--     headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' ||
--       (select decrypted_secret from vault.decrypted_secrets where name = 'campaign_activations_cron_secret')),
--     body := '{}'::jsonb, timeout_milliseconds := 55000) $$);
