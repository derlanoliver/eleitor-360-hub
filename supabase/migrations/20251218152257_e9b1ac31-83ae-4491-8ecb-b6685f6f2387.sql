-- Corrigir status da visita do David (form já foi aberto, mas status ficou em SCHEDULED)
UPDATE public.office_visits
SET status = 'FORM_OPENED',
    updated_at = now()
WHERE id = '143d245f-6708-46e8-a19a-4517eef4d482'
  AND status IN ('SCHEDULED', 'REGISTERED', 'LINK_SENT');