-- Adicionar novas colunas à tabela office_contacts para armazenar dados completos do formulário
ALTER TABLE office_contacts
ADD COLUMN endereco TEXT,
ADD COLUMN data_nascimento DATE,
ADD COLUMN instagram TEXT,
ADD COLUMN facebook TEXT;

-- Criar índice para busca por data de nascimento (útil para campanhas de aniversário)
CREATE INDEX idx_office_contacts_data_nascimento ON office_contacts(data_nascimento);

-- Criar política RLS para permitir UPDATE de contatos pelo formulário público
CREATE POLICY "office_contacts_update_from_form"
ON office_contacts
FOR UPDATE
TO anon
USING (
  EXISTS (
    SELECT 1 FROM office_visits
    WHERE office_visits.contact_id = office_contacts.id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM office_visits
    WHERE office_visits.contact_id = office_contacts.id
  )
);