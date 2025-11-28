-- Adicionar política para permitir usuários autenticados atualizarem check-in
-- Isso permite que qualquer usuário logado no sistema possa fazer check-in de participantes
CREATE POLICY "Authenticated users can update check-in" 
ON event_registrations 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);