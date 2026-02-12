
DROP FUNCTION IF EXISTS public.coordinator_get_dashboard(uuid);

CREATE FUNCTION public.coordinator_get_dashboard(p_leader_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_leader         record;
  v_subordinates   jsonb;
  v_events_part    jsonb;
  v_events_created jsonb;
  v_comms          jsonb;
  v_tree           jsonb;
  v_phone_suffix   text;
  v_cidade_nome    text;
  v_primeiro_nome  text;
BEGIN
  SELECT * INTO v_leader FROM public.lideres WHERE id = p_leader_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_phone_suffix := RIGHT(REGEXP_REPLACE(COALESCE(v_leader.telefone,''), '\D', '', 'g'), 8);

  -- Get city name
  SELECT nome INTO v_cidade_nome FROM public.office_cities WHERE id = v_leader.cidade_id;
  v_cidade_nome := COALESCE(v_cidade_nome, '');
  v_primeiro_nome := COALESCE(split_part(v_leader.nome_completo, ' ', 1), '');

  -- subordinates
  SELECT COALESCE(jsonb_agg(row_to_json(s)::jsonb ORDER BY s.created_at DESC), '[]'::jsonb)
  INTO v_subordinates
  FROM (
    SELECT id, nome_completo, telefone, pontuacao_total, cadastros, is_verified, created_at
    FROM public.lideres
    WHERE parent_leader_id = p_leader_id AND is_active = true
  ) s;

  -- events participated
  SELECT COALESCE(jsonb_agg(row_to_json(ep)::jsonb ORDER BY ep.date DESC), '[]'::jsonb)
  INTO v_events_part
  FROM (
    SELECT e.name, e.date, er.checked_in
    FROM public.event_registrations er
    JOIN public.events e ON e.id = er.event_id
    WHERE er.leader_id = p_leader_id
       OR (v_leader.email IS NOT NULL AND LOWER(er.email) = LOWER(v_leader.email))
       OR (v_phone_suffix <> '' AND RIGHT(REGEXP_REPLACE(er.whatsapp, '\D', '', 'g'), 8) = v_phone_suffix)
  ) ep;

  -- events created
  SELECT COALESCE(jsonb_agg(row_to_json(ec)::jsonb ORDER BY ec.date DESC), '[]'::jsonb)
  INTO v_events_created
  FROM (
    SELECT e.id, e.name, e.date, e.location, e.registrations_count, e.checkedin_count
    FROM public.events e
    WHERE EXISTS (
      SELECT 1 FROM public.event_registrations er2
      WHERE er2.event_id = e.id AND er2.leader_id = p_leader_id
    )
  ) ec;

  -- communications grouped by channel with variable replacement
  WITH wa AS (
    SELECT 'whatsapp' AS channel, wm.message AS subject, wm.message, wm.status, wm.sent_at,
           wm.phone, NULL AS to_email, wm.error_message,
           NULL::timestamptz AS delivered_at, NULL::timestamptz AS read_at, wm.created_at
    FROM public.whatsapp_messages wm
    WHERE v_phone_suffix <> '' AND RIGHT(REGEXP_REPLACE(wm.phone, '\D', '', 'g'), 8) = v_phone_suffix
    ORDER BY wm.created_at DESC LIMIT 30
  ),
  em_raw AS (
    SELECT el.id AS log_id,
           el.subject AS raw_subject,
           COALESCE(el.body_html, et.conteudo_html) AS raw_message,
           el.status, el.sent_at, el.to_email, el.error_message, el.created_at,
           el.event_id
    FROM public.email_logs el
    LEFT JOIN public.email_templates et ON et.id = el.template_id
    WHERE el.leader_id = p_leader_id
       OR (v_leader.email IS NOT NULL AND LOWER(el.to_email) = LOWER(v_leader.email))
       OR (v_phone_suffix <> '' AND EXISTS (
            SELECT 1 FROM public.lideres l2
            WHERE l2.id = el.leader_id
              AND RIGHT(REGEXP_REPLACE(COALESCE(l2.telefone,''), '\D', '', 'g'), 8) = v_phone_suffix
          ))
    ORDER BY el.created_at DESC LIMIT 30
  ),
  em AS (
    SELECT 'email' AS channel,
           REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
             er.raw_subject,
             '{{nome}}', v_leader.nome_completo),
             '{{nome_completo}}', v_leader.nome_completo),
             '{{primeiro_nome}}', v_primeiro_nome),
             '{{telefone}}', COALESCE(v_leader.telefone, '')),
             '{{email}}', COALESCE(v_leader.email, '')),
             '{{cidade}}', v_cidade_nome),
             '{{pontuacao}}', v_leader.pontuacao_total::text),
             '{{cadastros}}', v_leader.cadastros::text
           ) AS subject,
           REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
             COALESCE(er.raw_message, er.raw_subject),
             '{{nome}}', v_leader.nome_completo),
             '{{nome_completo}}', v_leader.nome_completo),
             '{{primeiro_nome}}', v_primeiro_nome),
             '{{telefone}}', COALESCE(v_leader.telefone, '')),
             '{{email}}', COALESCE(v_leader.email, '')),
             '{{cidade}}', v_cidade_nome),
             '{{pontuacao}}', v_leader.pontuacao_total::text),
             '{{cadastros}}', v_leader.cadastros::text),
             '{{evento_nome}}', COALESCE(ev.name, '')),
             '{{evento_data}}', COALESCE(TO_CHAR(ev.date::date, 'DD/MM/YYYY'), '')
           ) AS message,
           er.status, er.sent_at, NULL AS phone, er.to_email, er.error_message,
           NULL::timestamptz AS delivered_at, NULL::timestamptz AS read_at, er.created_at
    FROM em_raw er
    LEFT JOIN public.events ev ON ev.id = er.event_id
  ),
  sm AS (
    SELECT 'sms' AS channel, sms.message AS subject, sms.message, sms.status, sms.sent_at,
           sms.phone, NULL AS to_email, sms.error_message,
           sms.delivered_at, NULL::timestamptz AS read_at, sms.created_at
    FROM public.sms_messages sms
    WHERE v_phone_suffix <> '' AND RIGHT(REGEXP_REPLACE(sms.phone, '\D', '', 'g'), 8) = v_phone_suffix
    ORDER BY sms.created_at DESC LIMIT 30
  )
  SELECT jsonb_build_object(
    'whatsapp', COALESCE((SELECT jsonb_agg(row_to_json(wa)::jsonb) FROM wa), '[]'::jsonb),
    'email',    COALESCE((SELECT jsonb_agg(row_to_json(em)::jsonb) FROM em), '[]'::jsonb),
    'sms',      COALESCE((SELECT jsonb_agg(row_to_json(sm)::jsonb) FROM sm), '[]'::jsonb)
  ) INTO v_comms;

  -- tree totals
  WITH RECURSIVE tree AS (
    SELECT id, pontuacao_total, cadastros FROM public.lideres WHERE parent_leader_id = p_leader_id AND is_active = true
    UNION ALL
    SELECT l.id, l.pontuacao_total, l.cadastros FROM public.lideres l JOIN tree t ON l.parent_leader_id = t.id WHERE l.is_active = true
  )
  SELECT COALESCE(jsonb_build_object(
    'total_members', COUNT(*),
    'total_points', COALESCE(SUM(pontuacao_total), 0),
    'total_cadastros', COALESCE(SUM(cadastros), 0)
  ), '{"total_members":0,"total_points":0,"total_cadastros":0}'::jsonb)
  INTO v_tree FROM tree;

  RETURN jsonb_build_object(
    'subordinates', v_subordinates,
    'events_participated', v_events_part,
    'events_created', v_events_created,
    'communications', v_comms,
    'tree_totals', v_tree
  );
END;
$$;
