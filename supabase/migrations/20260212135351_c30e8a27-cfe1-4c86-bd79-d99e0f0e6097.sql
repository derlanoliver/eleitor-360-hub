
CREATE OR REPLACE FUNCTION public.coordinator_get_dashboard(p_leader_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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
    SELECT DISTINCT ON (e.id) e.id, e.name, e.date, e.location, er.checked_in
    FROM event_registrations er
    JOIN events e ON e.id = er.event_id
    WHERE er.leader_id = p_leader_id
       OR (v_email IS NOT NULL AND er.email = v_email)
       OR (v_phone_suffix IS NOT NULL AND er.whatsapp ILIKE '%' || v_phone_suffix || '%')
    ORDER BY e.id, e.date DESC
  ) ep;

  -- Events created
  SELECT COALESCE(jsonb_agg(row_to_json(ec.*)::jsonb), '[]'::jsonb)
  INTO v_events_created
  FROM (
    SELECT DISTINCT e.id, e.name, e.date, e.location, e.registrations_count, e.checkedin_count
    FROM events e
    WHERE EXISTS (SELECT 1 FROM event_registrations er WHERE er.event_id = e.id AND er.leader_id = p_leader_id)
    ORDER BY e.date DESC
    LIMIT 20
  ) ec;

  -- Communications grouped by channel - NOW WITH FULL MESSAGE
  SELECT jsonb_build_object(
    'whatsapp', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'subject', CASE WHEN length(wm.message) > 60 THEN substring(wm.message, 1, 60) || '...' ELSE wm.message END,
        'message', wm.message,
        'phone', wm.phone,
        'status', wm.status,
        'error_message', wm.error_message,
        'sent_at', COALESCE(wm.sent_at::text, wm.created_at::text),
        'created_at', wm.created_at::text,
        'delivered_at', wm.delivered_at::text,
        'read_at', wm.read_at::text
      ) ORDER BY COALESCE(wm.sent_at, wm.created_at) DESC)
      FROM whatsapp_messages wm
      WHERE v_phone_suffix IS NOT NULL AND wm.phone ILIKE '%' || v_phone_suffix || '%'
    ), '[]'::jsonb),
    'email', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'subject', el.subject,
        'message', NULL,
        'to_email', el.to_email,
        'status', el.status,
        'error_message', el.error_message,
        'sent_at', COALESCE(el.sent_at::text, el.created_at::text),
        'created_at', el.created_at::text,
        'delivered_at', NULL,
        'read_at', NULL
      ) ORDER BY COALESCE(el.sent_at, el.created_at) DESC)
      FROM email_logs el
      WHERE el.leader_id = p_leader_id OR (v_email IS NOT NULL AND el.to_email = v_email)
    ), '[]'::jsonb),
    'sms', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'subject', CASE WHEN length(sm.message) > 60 THEN substring(sm.message, 1, 60) || '...' ELSE sm.message END,
        'message', sm.message,
        'phone', sm.phone,
        'status', sm.status,
        'error_message', sm.error_message,
        'sent_at', COALESCE(sm.sent_at::text, sm.created_at::text),
        'created_at', sm.created_at::text,
        'delivered_at', sm.delivered_at::text,
        'read_at', NULL
      ) ORDER BY COALESCE(sm.sent_at, sm.created_at) DESC)
      FROM sms_messages sm
      WHERE v_phone_suffix IS NOT NULL AND sm.phone ILIKE '%' || v_phone_suffix || '%'
    ), '[]'::jsonb)
  ) INTO v_communications;

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
