-- Remove the problematic trigger that uses extensions.http_post
DROP TRIGGER IF EXISTS on_leader_verified_send_links ON lideres;

-- Remove the function that was used by the trigger
DROP FUNCTION IF EXISTS trigger_send_affiliate_links();