
-- Enable Realtime for public opinion tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.po_mentions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.po_sentiment_analyses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.po_daily_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.po_monitored_entities;
