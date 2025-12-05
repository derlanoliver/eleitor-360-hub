-- Fix overly permissive whatsapp_messages RLS policy
-- Remove the dangerous policy that allows anyone to update messages
DROP POLICY IF EXISTS "whatsapp_messages_update_public" ON public.whatsapp_messages;

-- Create a SECURITY DEFINER function for webhook updates
-- This allows the zapi-webhook edge function to update message statuses securely
CREATE OR REPLACE FUNCTION public.update_whatsapp_message_status(
  _message_id text,
  _status text,
  _delivered_at timestamptz DEFAULT NULL,
  _read_at timestamptz DEFAULT NULL,
  _error_message text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Validate status value
  IF _status NOT IN ('pending', 'sent', 'delivered', 'read', 'failed') THEN
    RAISE EXCEPTION 'Invalid status value: %', _status;
  END IF;

  UPDATE public.whatsapp_messages
  SET 
    status = _status,
    delivered_at = COALESCE(_delivered_at, delivered_at),
    read_at = COALESCE(_read_at, read_at),
    error_message = _error_message,
    updated_at = now()
  WHERE message_id = _message_id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count > 0;
END;
$$;

-- Grant execute permission to authenticated and anon users (for webhook calls)
GRANT EXECUTE ON FUNCTION public.update_whatsapp_message_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_whatsapp_message_status TO anon;

-- Create a restrictive update policy for authenticated users with proper roles
CREATE POLICY "whatsapp_messages_update_auth" 
ON public.whatsapp_messages 
FOR UPDATE 
USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role))
WITH CHECK (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));