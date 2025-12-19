-- Add retry tracking columns to sms_messages table
ALTER TABLE public.sms_messages 
ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_retry_at timestamptz,
ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
ADD COLUMN IF NOT EXISTS max_retries integer DEFAULT 6,
ADD COLUMN IF NOT EXISTS retry_history jsonb DEFAULT '[]'::jsonb;

-- Add index for efficient retry processing
CREATE INDEX IF NOT EXISTS idx_sms_messages_retry_pending 
ON public.sms_messages (status, retry_count, next_retry_at) 
WHERE status = 'failed' AND retry_count < 6;

-- Create function to calculate next retry time with exponential backoff
CREATE OR REPLACE FUNCTION public.calculate_sms_next_retry(_retry_count integer)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_delay_minutes numeric := 5;
  multiplier numeric;
  delay_minutes numeric;
BEGIN
  -- Calculate exponential backoff: 5 * 1.1^retry_count
  multiplier := power(1.1, _retry_count);
  delay_minutes := base_delay_minutes * multiplier;
  
  RETURN now() + (delay_minutes || ' minutes')::interval;
END;
$$;

-- Create function to update retry info when SMS fails
CREATE OR REPLACE FUNCTION public.update_sms_retry_on_failure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  retry_entry jsonb;
BEGIN
  -- Only process when status changes to 'failed'
  IF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    -- Calculate next retry time if under max retries
    IF NEW.retry_count < COALESCE(NEW.max_retries, 6) THEN
      NEW.next_retry_at := calculate_sms_next_retry(NEW.retry_count);
    ELSE
      NEW.next_retry_at := NULL;
    END IF;
    
    -- Add entry to retry history
    retry_entry := jsonb_build_object(
      'attempt', NEW.retry_count,
      'timestamp', now(),
      'status', 'failed',
      'error', NEW.error_message,
      'next_retry_at', NEW.next_retry_at
    );
    
    NEW.retry_history := COALESCE(NEW.retry_history, '[]'::jsonb) || retry_entry;
    NEW.last_retry_at := now();
  END IF;
  
  -- When delivered, add success entry to history
  IF NEW.status = 'delivered' AND OLD.status = 'failed' THEN
    retry_entry := jsonb_build_object(
      'attempt', NEW.retry_count,
      'timestamp', now(),
      'status', 'delivered'
    );
    NEW.retry_history := COALESCE(NEW.retry_history, '[]'::jsonb) || retry_entry;
    NEW.next_retry_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic retry tracking
DROP TRIGGER IF EXISTS trigger_sms_retry_tracking ON public.sms_messages;
CREATE TRIGGER trigger_sms_retry_tracking
BEFORE UPDATE ON public.sms_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_sms_retry_on_failure();