
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
  v_points int;
  v_level text;
  v_next_level text;
  v_points_to_next int;
  v_subordinates json;
  v_tree_total int;
  v_communications json;
BEGIN
  SELECT * INTO v_leader FROM lideres WHERE id = p_leader_id AND is_coordinator = true;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'not_coordinator');
  END IF;

  v_points := v_leader.pontuacao_total;

  SELECT
    CASE WHEN v_points >= 500 THEN 'Ouro' WHEN v_points >= 200 THEN 'Prata' ELSE 'Bronze' END,
    CASE WHEN v_points >= 500 THEN NULL WHEN v_points >= 200 THEN 'Ouro' ELSE 'Prata' END,
    CASE WHEN v_points >= 500 THEN 0 WHEN v_points >= 200 THEN 500 - v_points ELSE 200 - v_points END
  INTO v_level, v_next_level, v_points_to_next;

  SELECT json_agg(sub ORDER BY sub.nome_completo)
  INTO v_subordinates
  FROM (
    SELECT l.id, l.nome_completo, l.telefone, l.cadastros, l.pontuacao_total, l.is_active, l.created_at,
      (SELECT count(*) FROM lideres c WHERE c.parent_leader_id = l.id) as total_subordinados
    FROM lideres l WHERE l.parent_leader_id = p_leader_id ORDER BY l.nome_completo
  ) sub;

  WITH RECURSIVE tree AS (
    SELECT id FROM lideres WHERE parent_leader_id = p_leader_id
    UNION ALL
    SELECT l.id FROM lideres l INNER JOIN tree t ON l.parent_leader_id = t.id
  )
  SELECT count(*) INTO v_tree_total FROM tree;

  SELECT json_agg(comm ORDER BY comm.created_at DESC)
  INTO v_communications
  FROM (
    (SELECT 'whatsapp' as channel, wm.message as subject, wm.message as message, wm.status, wm.sent_at, wm.phone, NULL as to_email, wm.error_message, NULL::timestamptz as delivered_at, NULL::timestamptz as read_at, wm.created_at
     FROM whatsapp_messages wm WHERE wm.leader_id = p_leader_id ORDER BY wm.created_at DESC LIMIT 50)
    UNION ALL
    (SELECT 'email' as channel, left(el.subject, 60) as subject,
      COALESCE(el.body_html, et.conteudo_html, el.subject) as message,
      el.status, el.sent_at, NULL as phone, el.to_email, el.error_message, NULL::timestamptz as delivered_at, NULL::timestamptz as read_at, el.created_at
     FROM email_logs el LEFT JOIN email_templates et ON et.id = el.template_id
     WHERE el.leader_id = p_leader_id ORDER BY el.created_at DESC LIMIT 50)
    UNION ALL
    (SELECT 'sms' as channel, sm.message as subject, sm.message as message, sm.status, sm.sent_at, sm.phone, NULL as to_email, sm.error_message, sm.delivered_at, sm.read_at, sm.created_at
     FROM sms_messages sm WHERE sm.leader_id = p_leader_id ORDER BY sm.created_at DESC LIMIT 50)
  ) comm;

  v_result := json_build_object(
    'leader', json_build_object('id', v_leader.id, 'nome', v_leader.nome_completo, 'telefone', v_leader.telefone, 'pontuacao', v_points, 'cadastros', v_leader.cadastros, 'nivel', v_level, 'proximo_nivel', v_next_level, 'pontos_proximo_nivel', v_points_to_next),
    'subordinates', COALESCE(v_subordinates, '[]'::json),
    'tree_total', v_tree_total,
    'communications', COALESCE(v_communications, '[]'::json)
  );
  RETURN v_result;
END;
$$;
