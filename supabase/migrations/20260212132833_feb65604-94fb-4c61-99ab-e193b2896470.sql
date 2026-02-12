
CREATE OR REPLACE FUNCTION public.coordinator_get_dashboard(p_leader_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text;
  v_email text;
  v_phone_suffix text;
  v_subordinates jsonb;
  v_events_participated jsonb;
  v_events_created jsonb;
  v_communications jsonb;
  v_tree_totals jsonb;
BEGIN
  SELECT telefone, email INTO v_phone, v_email
  FROM lideres WHERE id = p_leader_id;

  IF v_phone IS NOT NULL THEN
    v_phone_suffix := right(regexp_replace(v_phone, '\D', '', 'g'), 8);
  END IF;

  -- Subordinates
  SELECT COALESCE(jsonb_agg(row_to_json(s.*)::jsonb), '[]'::jsonb)
  INTO v_subordinates
  FROM (
    SELECT id, nome_completo, telefone, pontuacao_total, cadastros, is_verified, created_at
    FROM lideres
    WHERE parent_leader_id = p_leader_id AND is_active = true
    ORDER BY created_at DESC
    LIMIT 100
  ) s;

  -- Events participated
  SELECT COALESCE(jsonb_agg(row_to_json(ep.*)::jsonb), '[]'::jsonb)
  INTO v_events_participated
  FROM (
    SELECT e.name, e.date, e.location, er.checked_in
    FROM event_registrations er
    JOIN events e ON e.id = er.event_id
    WHERE er.leader_id = p_leader_id
    ORDER BY e.date DESC
    LIMIT 50
  ) ep;

  -- Events created (events where leader has registrations)
  SELECT COALESCE(jsonb_agg(row_to_json(ec.*)::jsonb), '[]'::jsonb)
  INTO v_events_created
  FROM (
    SELECT DISTINCT e.id, e.name, e.date, e.location, e.registrations_count, e.checkedin_count
    FROM events e
    WHERE EXISTS (SELECT 1 FROM event_registrations er WHERE er.event_id = e.id AND er.leader_id = p_leader_id)
    ORDER BY e.date DESC
    LIMIT 20
  ) ec;

  -- Communications
  SELECT COALESCE(jsonb_agg(c ORDER BY c->>'sent_at' DESC NULLS LAST), '[]'::jsonb)
  INTO v_communications
  FROM (
    SELECT jsonb_build_object(
      'channel', 'whatsapp',
      'subject', CASE WHEN length(message) > 60 THEN substring(message, 1, 60) || '...' ELSE message END,
      'status', status,
      'sent_at', COALESCE(sent_at::text, created_at::text)
    ) as c
    FROM whatsapp_messages
    WHERE v_phone_suffix IS NOT NULL AND phone ILIKE '%' || v_phone_suffix || '%'
    ORDER BY created_at DESC
    LIMIT 20
  ) sub;

  -- Add email communications
  SELECT v_communications || COALESCE(jsonb_agg(c), '[]'::jsonb)
  INTO v_communications
  FROM (
    SELECT jsonb_build_object(
      'channel', 'email',
      'subject', subject,
      'status', status,
      'sent_at', COALESCE(sent_at::text, created_at::text)
    ) as c
    FROM email_logs
    WHERE leader_id = p_leader_id OR (v_email IS NOT NULL AND to_email = v_email)
    ORDER BY created_at DESC
    LIMIT 20
  ) sub;

  -- Add SMS communications
  IF v_phone_suffix IS NOT NULL THEN
    SELECT v_communications || COALESCE(jsonb_agg(c), '[]'::jsonb)
    INTO v_communications
    FROM (
      SELECT jsonb_build_object(
        'channel', 'sms',
        'subject', CASE WHEN length(message) > 60 THEN substring(message, 1, 60) || '...' ELSE message END,
        'status', status,
        'sent_at', COALESCE(sent_at::text, created_at::text)
      ) as c
      FROM sms_messages
      WHERE phone ILIKE '%' || v_phone_suffix || '%'
      ORDER BY created_at DESC
      LIMIT 20
    ) sub;
  END IF;

  -- Tree totals
  SELECT jsonb_build_object(
    'total_members', count(*),
    'total_points', COALESCE(sum(pontuacao_total), 0),
    'total_cadastros', COALESCE(sum(cadastros), 0)
  )
  INTO v_tree_totals
  FROM lideres
  WHERE parent_leader_id = p_leader_id AND is_active = true;

  RETURN jsonb_build_object(
    'subordinates', v_subordinates,
    'events_participated', v_events_participated,
    'events_created', v_events_created,
    'communications', v_communications,
    'tree_totals', v_tree_totals
  );
END;
$$;
