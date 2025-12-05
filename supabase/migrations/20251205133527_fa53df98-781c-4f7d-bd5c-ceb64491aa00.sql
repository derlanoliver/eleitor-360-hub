-- Parte 1: Corrigir RLS do toggle de líder para aceitar super_admin
DROP POLICY IF EXISTS lideres_modify ON lideres;
CREATE POLICY lideres_modify ON lideres
  FOR ALL
  TO authenticated
  USING (has_admin_access(auth.uid()))
  WITH CHECK (has_admin_access(auth.uid()));

-- Parte 2: Adicionar campos de opt-out na tabela office_contacts
ALTER TABLE office_contacts 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS opted_out_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS opt_out_reason text,
ADD COLUMN IF NOT EXISTS opt_out_channel text;

-- Gerar token único para descadastro
ALTER TABLE office_contacts
ADD COLUMN IF NOT EXISTS unsubscribe_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

-- Índice para busca por token
CREATE INDEX IF NOT EXISTS idx_contacts_unsubscribe_token ON office_contacts(unsubscribe_token);

-- Gerar tokens para contatos existentes que não têm
UPDATE office_contacts 
SET unsubscribe_token = encode(gen_random_bytes(16), 'hex')
WHERE unsubscribe_token IS NULL;