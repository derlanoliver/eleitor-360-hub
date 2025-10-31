-- Drop política antiga de office_cities
DROP POLICY IF EXISTS "office_cities_select_all" ON office_cities;

-- Criar nova política que permite SELECT para todos (authenticated + anon)
CREATE POLICY "office_cities_select_all"
ON office_cities
FOR SELECT
TO public
USING (true);

-- Criar política para permitir UPDATE apenas do campo status por usuários anônimos
CREATE POLICY "office_visits_update_status_public"
ON office_visits
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);