-- Criar tabela de histórico de atividades de contatos
CREATE TABLE public.contact_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES office_contacts(id) ON DELETE CASCADE,
  action text NOT NULL,
  action_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_contact_activity_log_contact_id ON contact_activity_log(contact_id);
CREATE INDEX idx_contact_activity_log_created_at ON contact_activity_log(created_at DESC);

-- Habilitar RLS
ALTER TABLE contact_activity_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY contact_activity_log_select ON contact_activity_log
  FOR SELECT TO authenticated
  USING (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));

CREATE POLICY contact_activity_log_insert ON contact_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (has_admin_access(auth.uid()) OR has_role(auth.uid(), 'atendente'::app_role));