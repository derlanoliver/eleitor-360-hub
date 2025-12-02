-- Create table for WhatsApp message tracking
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,                        -- ID da mensagem no Z-API
  phone TEXT NOT NULL,                    -- Telefone do destinatário
  message TEXT NOT NULL,                  -- Conteúdo da mensagem
  direction TEXT NOT NULL DEFAULT 'outgoing', -- outgoing/incoming
  status TEXT NOT NULL DEFAULT 'pending',    -- pending/sent/delivered/read/failed
  visit_id UUID REFERENCES office_visits(id),
  contact_id UUID REFERENCES office_contacts(id),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for message_id lookups (webhook updates)
CREATE INDEX idx_whatsapp_messages_message_id ON public.whatsapp_messages(message_id);

-- Create index for visit_id lookups
CREATE INDEX idx_whatsapp_messages_visit_id ON public.whatsapp_messages(visit_id);

-- Create index for phone lookups
CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages(phone);

-- Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all messages
CREATE POLICY "whatsapp_messages_select_admin" ON public.whatsapp_messages
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy for atendentes to view messages
CREATE POLICY "whatsapp_messages_select_atendente" ON public.whatsapp_messages
  FOR SELECT USING (has_role(auth.uid(), 'atendente'::app_role));

-- Policy for edge functions to insert (no auth required for webhooks)
CREATE POLICY "whatsapp_messages_insert_public" ON public.whatsapp_messages
  FOR INSERT WITH CHECK (true);

-- Policy for edge functions to update (webhook status updates)
CREATE POLICY "whatsapp_messages_update_public" ON public.whatsapp_messages
  FOR UPDATE USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();