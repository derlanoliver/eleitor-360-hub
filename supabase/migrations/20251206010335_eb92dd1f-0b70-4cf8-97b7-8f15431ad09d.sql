
-- Limpar event_registrations - remover contact_id de registros de líderes
UPDATE event_registrations r
SET contact_id = NULL
WHERE contact_id IS NOT NULL
AND EXISTS (
  SELECT 1 FROM lideres l
  WHERE l.is_active = true
  AND (
    normalize_phone_e164(l.telefone) = normalize_phone_e164(r.whatsapp)
    OR (l.email IS NOT NULL AND LOWER(l.email) = LOWER(r.email))
  )
);

-- Limpar whatsapp_messages - desvincular de contatos de líderes
UPDATE whatsapp_messages m
SET contact_id = NULL
WHERE contact_id IS NOT NULL
AND EXISTS (
  SELECT 1 FROM office_contacts c
  WHERE c.id = m.contact_id
  AND EXISTS (
    SELECT 1 FROM lideres l
    WHERE l.is_active = true
    AND (
      normalize_phone_e164(l.telefone) = c.telefone_norm
      OR (l.email IS NOT NULL AND c.email IS NOT NULL AND LOWER(l.email) = LOWER(c.email))
    )
  )
);

-- Limpar email_logs - desvincular de contatos de líderes
UPDATE email_logs e
SET contact_id = NULL
WHERE contact_id IS NOT NULL
AND EXISTS (
  SELECT 1 FROM office_contacts c
  WHERE c.id = e.contact_id
  AND EXISTS (
    SELECT 1 FROM lideres l
    WHERE l.is_active = true
    AND (
      normalize_phone_e164(l.telefone) = c.telefone_norm
      OR (l.email IS NOT NULL AND c.email IS NOT NULL AND LOWER(l.email) = LOWER(c.email))
    )
  )
);

-- Deletar contact_activity_log de contatos de líderes
DELETE FROM contact_activity_log a
WHERE EXISTS (
  SELECT 1 FROM office_contacts c
  WHERE c.id = a.contact_id
  AND EXISTS (
    SELECT 1 FROM lideres l
    WHERE l.is_active = true
    AND (
      normalize_phone_e164(l.telefone) = c.telefone_norm
      OR (l.email IS NOT NULL AND c.email IS NOT NULL AND LOWER(l.email) = LOWER(c.email))
    )
  )
);

-- Deletar contact_downloads de contatos de líderes
DELETE FROM contact_downloads d
WHERE EXISTS (
  SELECT 1 FROM office_contacts c
  WHERE c.id = d.contact_id
  AND EXISTS (
    SELECT 1 FROM lideres l
    WHERE l.is_active = true
    AND (
      normalize_phone_e164(l.telefone) = c.telefone_norm
      OR (l.email IS NOT NULL AND c.email IS NOT NULL AND LOWER(l.email) = LOWER(c.email))
    )
  )
);

-- Deletar contact_page_views de contatos de líderes
DELETE FROM contact_page_views p
WHERE EXISTS (
  SELECT 1 FROM office_contacts c
  WHERE c.id = p.contact_id
  AND EXISTS (
    SELECT 1 FROM lideres l
    WHERE l.is_active = true
    AND (
      normalize_phone_e164(l.telefone) = c.telefone_norm
      OR (l.email IS NOT NULL AND c.email IS NOT NULL AND LOWER(l.email) = LOWER(c.email))
    )
  )
);

-- Agora deletar contatos duplicados que não estão em office_visits
DELETE FROM office_contacts c
WHERE EXISTS (
  SELECT 1 FROM lideres l
  WHERE l.is_active = true
  AND (
    normalize_phone_e164(l.telefone) = c.telefone_norm
    OR (l.email IS NOT NULL AND c.email IS NOT NULL AND LOWER(l.email) = LOWER(c.email))
  )
)
AND NOT EXISTS (SELECT 1 FROM office_visits WHERE contact_id = c.id);
