-- Permitir que usuários anônimos criem visitas via formulário de afiliado
CREATE POLICY "office_visits_insert_from_affiliate"
ON public.office_visits
FOR INSERT
TO anon
WITH CHECK (
  -- Garantir que a visita é criada com dados válidos
  contact_id IS NOT NULL 
  AND leader_id IS NOT NULL 
  AND city_id IS NOT NULL
  AND protocolo IS NOT NULL
);

-- Comentário explicativo
COMMENT ON POLICY "office_visits_insert_from_affiliate" ON public.office_visits IS 
'Permite que usuários anônimos criem visitas através do formulário de afiliado. Valida que todos os campos obrigatórios estejam preenchidos.';