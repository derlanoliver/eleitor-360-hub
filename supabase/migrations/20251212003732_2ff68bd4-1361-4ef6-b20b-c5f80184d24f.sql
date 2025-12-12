-- Create scheduled_messages table
CREATE TABLE public.scheduled_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_type TEXT NOT NULL CHECK (message_type IN ('sms', 'email', 'whatsapp')),
  recipient_phone TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  template_slug TEXT NOT NULL,
  variables JSONB DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  contact_id UUID REFERENCES public.office_contacts(id),
  leader_id UUID REFERENCES public.lideres(id),
  batch_id UUID,
  CONSTRAINT valid_recipient CHECK (
    (message_type = 'email' AND recipient_email IS NOT NULL) OR
    (message_type IN ('sms', 'whatsapp') AND recipient_phone IS NOT NULL)
  )
);

-- Create indexes for efficient querying
CREATE INDEX idx_scheduled_messages_status_scheduled ON public.scheduled_messages(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_scheduled_messages_batch ON public.scheduled_messages(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_scheduled_messages_created_by ON public.scheduled_messages(created_by);

-- Enable RLS
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "scheduled_messages_select" ON public.scheduled_messages
  FOR SELECT USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

CREATE POLICY "scheduled_messages_insert" ON public.scheduled_messages
  FOR INSERT WITH CHECK (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

CREATE POLICY "scheduled_messages_update" ON public.scheduled_messages
  FOR UPDATE USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

CREATE POLICY "scheduled_messages_delete" ON public.scheduled_messages
  FOR DELETE USING (has_admin_access(auth.uid()));

-- Enable pg_cron and pg_net extensions for scheduled processing
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;