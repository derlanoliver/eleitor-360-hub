
CREATE OR REPLACE FUNCTION get_unanalyzed_mention_ids(_entity_id uuid, _limit int DEFAULT 200)
RETURNS TABLE(id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id
  FROM po_mentions m
  LEFT JOIN po_sentiment_analyses sa ON sa.mention_id = m.id
  WHERE m.entity_id = _entity_id
    AND sa.id IS NULL
  ORDER BY m.collected_at DESC
  LIMIT _limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
