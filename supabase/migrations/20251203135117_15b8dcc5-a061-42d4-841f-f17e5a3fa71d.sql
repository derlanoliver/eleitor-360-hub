-- Create support_tickets table
CREATE TABLE public.support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    protocolo text NOT NULL UNIQUE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assunto text NOT NULL,
    categoria text NOT NULL,
    prioridade text NOT NULL DEFAULT 'media',
    status text NOT NULL DEFAULT 'aberto',
    descricao text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz
);

-- Create support_ticket_messages table
CREATE TABLE public.support_ticket_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mensagem text NOT NULL,
    is_admin_response boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create system_notifications table
CREATE TABLE public.system_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo text NOT NULL,
    descricao text NOT NULL,
    tipo text NOT NULL DEFAULT 'atualizacao',
    is_active boolean DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz
);

-- Create user_notification_reads table
CREATE TABLE public.user_notification_reads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_id uuid REFERENCES public.system_notifications(id) ON DELETE CASCADE,
    ticket_message_id uuid REFERENCES public.support_ticket_messages(id) ON DELETE CASCADE,
    read_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, notification_id),
    UNIQUE(user_id, ticket_message_id)
);

-- Function to generate support protocol
CREATE OR REPLACE FUNCTION public.generate_support_protocol()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _date TEXT;
    _sequence INTEGER;
    _protocol TEXT;
BEGIN
    _date := to_char(now(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(substring(protocolo from '[0-9]+$') AS INTEGER)), 0) + 1
    INTO _sequence
    FROM support_tickets
    WHERE protocolo LIKE 'SUP-' || _date || '-%';
    
    _protocol := 'SUP-' || _date || '-' || lpad(_sequence::TEXT, 4, '0');
    
    RETURN _protocol;
END;
$$;

-- Trigger to set protocol on insert
CREATE OR REPLACE FUNCTION public.set_support_ticket_protocol()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.protocolo IS NULL THEN
        NEW.protocolo := generate_support_protocol();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_support_ticket_protocol_trigger
BEFORE INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.set_support_ticket_protocol();

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
CREATE POLICY "support_tickets_select_own"
ON public.support_tickets
FOR SELECT
USING (user_id = auth.uid() OR is_super_admin(auth.uid()));

CREATE POLICY "support_tickets_insert_own"
ON public.support_tickets
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "support_tickets_update_admin"
ON public.support_tickets
FOR UPDATE
USING (is_super_admin(auth.uid()));

-- RLS Policies for support_ticket_messages
CREATE POLICY "support_ticket_messages_select"
ON public.support_ticket_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM support_tickets
        WHERE id = ticket_id
        AND (user_id = auth.uid() OR is_super_admin(auth.uid()))
    )
);

CREATE POLICY "support_ticket_messages_insert_own"
ON public.support_ticket_messages
FOR INSERT
WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM support_tickets
        WHERE id = ticket_id
        AND (user_id = auth.uid() OR is_super_admin(auth.uid()))
    )
);

-- RLS Policies for system_notifications
CREATE POLICY "system_notifications_select"
ON public.system_notifications
FOR SELECT
USING (is_active = true OR is_super_admin(auth.uid()));

CREATE POLICY "system_notifications_modify"
ON public.system_notifications
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- RLS Policies for user_notification_reads
CREATE POLICY "user_notification_reads_select_own"
ON public.user_notification_reads
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "user_notification_reads_insert_own"
ON public.user_notification_reads
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_notification_reads_delete_own"
ON public.user_notification_reads
FOR DELETE
USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);
CREATE INDEX idx_system_notifications_active ON public.system_notifications(is_active);
CREATE INDEX idx_user_notification_reads_user_id ON public.user_notification_reads(user_id);