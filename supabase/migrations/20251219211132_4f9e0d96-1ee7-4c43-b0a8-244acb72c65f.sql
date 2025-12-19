-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function that calls the edge function when a leader is verified
CREATE OR REPLACE FUNCTION public.trigger_send_affiliate_links()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger when is_verified changes from false/null to true
  IF NEW.is_verified = true AND (OLD.is_verified IS NULL OR OLD.is_verified = false) THEN
    -- Log the trigger
    RAISE LOG '[trigger_send_affiliate_links] Leader % verified, calling edge function', NEW.id;
    
    -- Call edge function asynchronously via pg_net
    PERFORM extensions.http_post(
      url := 'https://eydqducvsddckhyatcux.supabase.co/functions/v1/send-leader-affiliate-links',
      body := jsonb_build_object('leader_id', NEW.id::text),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZHFkdWN2c2RkY2toeWF0Y3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMjg0MTYsImV4cCI6MjA3NDgwNDQxNn0.CFbMjvFsgQBevtV_B-fDTTNvvNRJ3Bwx_f4iOMXnfPA'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on lideres table
DROP TRIGGER IF EXISTS on_leader_verified_send_links ON public.lideres;
CREATE TRIGGER on_leader_verified_send_links
  AFTER UPDATE OF is_verified ON public.lideres
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_affiliate_links();