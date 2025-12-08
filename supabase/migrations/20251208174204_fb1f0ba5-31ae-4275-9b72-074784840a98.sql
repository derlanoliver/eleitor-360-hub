
-- Migração: Promover participantes do evento "Reunião de Lideranças" para líderes
-- Evento ID: 64556876-3b38-41db-ba59-3338c1f97f9a

-- 1. Criar líderes a partir dos participantes não-líderes
INSERT INTO lideres (
  nome_completo,
  email,
  telefone,
  cidade_id,
  pontuacao_total,
  cadastros,
  is_active,
  status,
  join_date,
  created_at
)
SELECT 
  er.nome,
  er.email,
  normalize_phone_e164(er.whatsapp),
  er.cidade_id,
  CASE WHEN er.checked_in = true THEN 3 ELSE 1 END, -- 1 pt inscrição + 2 pts check-in
  0,
  true,
  'active',
  er.created_at,
  now()
FROM event_registrations er
WHERE er.event_id = '64556876-3b38-41db-ba59-3338c1f97f9a'
  AND er.leader_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM lideres l 
    WHERE normalize_phone_e164(l.telefone) = normalize_phone_e164(er.whatsapp)
       OR l.email = er.email
  );

-- 2. Vincular as inscrições aos novos líderes criados
UPDATE event_registrations er
SET leader_id = (
  SELECT l.id 
  FROM lideres l 
  WHERE normalize_phone_e164(l.telefone) = normalize_phone_e164(er.whatsapp)
     OR l.email = er.email
  LIMIT 1
)
WHERE er.event_id = '64556876-3b38-41db-ba59-3338c1f97f9a'
  AND er.leader_id IS NULL;

-- 3. Registrar atividade de promoção no log (para quem tem contact_id)
INSERT INTO contact_activity_log (contact_id, action, details)
SELECT 
  er.contact_id,
  'promoted_to_leader',
  jsonb_build_object(
    'source', 'event_migration',
    'event_id', er.event_id,
    'event_name', 'Reunião de Lideranças',
    'leader_id', er.leader_id,
    'original_registration_date', er.created_at
  )
FROM event_registrations er
WHERE er.event_id = '64556876-3b38-41db-ba59-3338c1f97f9a'
  AND er.contact_id IS NOT NULL
  AND er.leader_id IS NOT NULL;

-- 4. Garantir que líderes existentes que se inscreveram recebam seus pontos
-- +1 por inscrição, +2 se fizeram check-in
UPDATE lideres l
SET pontuacao_total = pontuacao_total + 
  CASE WHEN er.checked_in = true THEN 3 ELSE 1 END
FROM event_registrations er
WHERE er.event_id = '64556876-3b38-41db-ba59-3338c1f97f9a'
  AND er.leader_id = l.id
  AND l.created_at < '2024-12-07'; -- Líderes que já existiam antes da migração
