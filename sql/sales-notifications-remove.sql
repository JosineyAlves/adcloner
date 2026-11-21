-- Remove por completo as notificações de venda (rodar no Supabase SQL editor).
drop table if exists public.hw_postback_log;
drop table if exists public.push_subscriptions;
drop table if exists public.hw_sales;
drop table if exists public.hw_integrations;
-- Vercel: apagar SALES_NOTIFY_EMAILS, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_SUBJECT.
-- No código: apagar lib/sales-notifications.ts, components/notifications, app/notificacoes,
-- app/api/notifications, app/api/postbacks, public/sw.js, o item "Notificações" da Sidebar e
-- '/api/postbacks' em PUBLIC_PATHS (lib/supabase/middleware.ts). Na H&W: apagar o postback do vmetrics.
