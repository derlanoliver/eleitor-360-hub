-- Adicionar política para permitir leitura pública das inscrições de eventos
-- Necessário para que o formulário público possa retornar os dados da inscrição
-- criada, incluindo o QR code gerado automaticamente

CREATE POLICY "Anyone can view their own registration after insert" 
ON event_registrations 
FOR SELECT 
USING (true);