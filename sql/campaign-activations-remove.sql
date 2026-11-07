-- Remove por completo a ativação agendada (rodar no Supabase SQL editor).
select cron.unschedule('campaign-activations-runner') where exists (select 1 from cron.job where jobname = 'campaign-activations-runner');
drop table if exists public.campaign_activation_runs;
drop table if exists public.campaign_activations;
delete from vault.secrets where name = 'campaign_activations_cron_secret';
-- (opcional) drop extension pg_cron; drop extension pg_net;  -- só se nenhum outro job usar
-- Vercel: apagar as variáveis ACTIVATION_CRON_SECRET e ACTIVATION_SCHEDULE_EMAILS.
