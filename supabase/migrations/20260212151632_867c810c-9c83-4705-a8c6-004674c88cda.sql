
DROP FUNCTION IF EXISTS public.coordinator_get_dashboard(uuid);

CREATE OR REPLACE FUNCTION public.coordinator_get_dashboard(p_leader_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
  v_leader record;
  v_subordinates json;
  v_events_participated json;
  v_events_created json;
  v_tree_totals json;
  v_whatsapp json;
  v_email json;
  v_sms json;
  v_phone_suffix text;
BEGIN
  SELECT * INTO v_leader FROM lideres WHERE id = p_leader_id AND is_coordinator = true;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'not_coordinator');
  END IF;

  v_phone_suffix := right(regexp_replace(COALESCE(v_leader.telefone,''), '\D', '', 'g'), 8);

  -- Subordinates
  SELECT COALESCE(json_agg(sub ORDER BY sub.nome_completo), '[]'::json)
  INTO v_subordinates
  FROM (
    SELECT l.id, l.nome_completo, l.telefone, l.cadastros, l.pontuacao_total,
           l.is_active, l.is_verified, l.created_at
    FROM lideres l WHERE l.parent_leader_id = p_leader_id ORDER BY l.nome_completo
  ) sub;

  -- Events participated
  SELECT COALESCE(json_agg(ep ORDER BY ep.date DESC), '[]'::json)
  INTO v_events_participated
  FROM (
    SELECT DISTINCT e.id, e.name, e.date, e.time, e.location,
           er.checked_in, er.checked_in_at
    FROM event_registrations er
    JOIN events e ON e.id = er.event_id
    WHERE v_phone_suffix <> '' AND (
      er.whatsapp ILIKE '%' || v_phone_suffix || '%'
      OR (v_leader.email IS NOT NULL AND er.email = v_leader.email)
    )
    ORDER BY e.date DESC
    LIMIT 50
  ) ep;

  -- Events created by coordinator
  SELECT COALESCE(json_agg(ec ORDER BY ec.date DESC), '[]'::json)
  INTO v_events_created
  FROM (
    SELECT e.id, e.name, e.date, e.time, e.location, e.slug,
           e.registrations_count, e.checkedin_count
    FROM events e
    JOIN event_registrations er ON er.event_id = e.id AND er.leader_id = p_leader_id
    GROUP BY e.id
    ORDER BY e.date DESC
    LIMIT 20
  ) ec;

  -- Tree totals
  WITH RECURSIVE tree AS (
    SELECT id, pontuacao_total, cadastros FROM lideres WHERE parent_leader_id = p_leader_id
    UNION ALL
    SELECT l.id, l.pontuacao_total, l.cadastros FROM lideres l INNER JOIN tree t ON l.parent_leader_id = t.id
  )
  SELECT json_build_object(
    'total_members', count(*),
    'total_points', COALESCE(sum(pontuacao_total), 0),
    'total_cadastros', COALESCE(sum(cadastros), 0)
  ) INTO v_tree_totals FROM tree;

  -- WhatsApp
  SELECT COALESCE(json_agg(w ORDER BY w.created_at DESC), '[]'::json) INTO v_whatsapp
  FROM (
    SELECT wm.message as subject, wm.message, wm.status, wm.sent_at, wm.phone, wm.error_message, wm.created_at
    FROM whatsapp_messages wm
    WHERE v_phone_suffix <> '' AND wm.phone ILIKE '%' || v_phone_suffix || '%'
    ORDER BY wm.created_at DESC LIMIT 50
  ) w;

  -- Email (sem body_html)
  SELECT COALESCE(json_agg(em ORDER BY em.created_at DESC), '[]'::json) INTO v_email
  FROM (
    SELECT left(el.subject, 60) as subject,
           COALESCE(et.conteudo_html, el.subject) as message,
           el.status, el.sent_at, el.to_email, el.error_message, el.created_at
    FROM email_logs el LEFT JOIN email_templates et ON et.id = el.template_id
    WHERE el.leader_id = p_leader_id
       OR (v_leader.email IS NOT NULL AND el.to_email = v_leader.email)
    ORDER BY el.created_at DESC LIMIT 50
  ) em;

  -- SMS
  SELECT COALESCE(json_agg(s ORDER BY s.created_at DESC), '[]'::json) INTO v_sms
  FROM (
    SELECT sm.message as subject, sm.message, sm.status, sm.sent_at, sm.phone, sm.error_message, sm.delivered_at, sm.created_at
    FROM sms_messages sm
    WHERE v_phone_suffix <> '' AND sm.phone ILIKE '%' || v_phone_suffix || '%'
    ORDER BY sm.created_at DESC LIMIT 50
  ) s;

  v_result := json_build_object(
    'subordinates', v_subordinates,
    'events_participated', v_events_participated,
    'events_created', v_events_created,
    'tree_totals', v_tree_totals,
    'communications', json_build_object('whatsapp', v_whatsapp, 'email', v_email, 'sms', v_sms)
  );
  RETURN v_result;
END;
$$;
