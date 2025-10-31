-- =====================================================
-- MÓDULO GABINETE - Schema Completo
-- =====================================================

-- 1. Criar ENUMs
CREATE TYPE office_visit_status AS ENUM (
  'REGISTERED',
  'LINK_SENT',
  'FORM_OPENED',
  'FORM_SUBMITTED',
  'CHECKED_IN',
  'CANCELLED'
);

CREATE TYPE office_city_status AS ENUM ('active', 'inactive');
CREATE TYPE office_leader_status AS ENUM ('active', 'inactive');

-- 2. Tabela: office_cities (Cidades/RAs do DF)
CREATE TABLE public.office_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo_ra TEXT UNIQUE NOT NULL,
  status office_city_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabela: office_leaders (Líderes por cidade)
CREATE TABLE public.office_leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  cidade_id UUID NOT NULL REFERENCES public.office_cities(id) ON DELETE RESTRICT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status office_leader_status NOT NULL DEFAULT 'active',
  pontuacao_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_office_leaders_cidade_status ON public.office_leaders(cidade_id, status);
CREATE INDEX idx_office_leaders_tenant ON public.office_leaders(tenant_id);

-- 4. Tabela: office_contacts (Contatos com dedupe por telefone)
CREATE TABLE public.office_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone_norm TEXT UNIQUE NOT NULL,
  cidade_id UUID NOT NULL REFERENCES public.office_cities(id) ON DELETE RESTRICT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_office_contacts_telefone ON public.office_contacts(telefone_norm);
CREATE INDEX idx_office_contacts_tenant ON public.office_contacts(tenant_id);

-- 5. Tabela: office_visits (Visitas ao gabinete)
CREATE TABLE public.office_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo TEXT UNIQUE NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.office_contacts(id) ON DELETE RESTRICT,
  leader_id UUID NOT NULL REFERENCES public.office_leaders(id) ON DELETE RESTRICT,
  city_id UUID NOT NULL REFERENCES public.office_cities(id) ON DELETE RESTRICT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status office_visit_status NOT NULL DEFAULT 'REGISTERED',
  token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  webhook_sent_at TIMESTAMP WITH TIME ZONE,
  webhook_last_status INTEGER,
  webhook_error TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_office_visits_status_created ON public.office_visits(status, created_at DESC);
CREATE INDEX idx_office_visits_tenant_status ON public.office_visits(tenant_id, status);
CREATE INDEX idx_office_visits_protocolo ON public.office_visits(protocolo);

-- 6. Tabela: office_visit_forms (Dados do formulário público)
CREATE TABLE public.office_visit_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID UNIQUE NOT NULL REFERENCES public.office_visits(id) ON DELETE CASCADE,
  endereco TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  aceita_reuniao BOOLEAN NOT NULL,
  continua_projeto BOOLEAN NOT NULL,
  instagram TEXT,
  facebook TEXT,
  observacoes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Tabela: office_settings (Configurações do módulo)
CREATE TABLE public.office_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  protocolo_prefix TEXT NOT NULL DEFAULT 'RP-GB',
  sound_notification_url TEXT,
  pontos_form_submitted INTEGER NOT NULL DEFAULT 1,
  pontos_aceita_reuniao INTEGER NOT NULL DEFAULT 3,
  webhook_url TEXT NOT NULL DEFAULT 'https://webhook.escaladigital.ai/webhook/gabinete/envio-formulario',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Função: generate_office_protocol
CREATE OR REPLACE FUNCTION public.generate_office_protocol(
  _tenant_id UUID,
  _prefix TEXT DEFAULT 'RP-GB'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _date TEXT;
  _sequence INTEGER;
  _protocol TEXT;
BEGIN
  _date := to_char(now(), 'YYYYMMDD');
  
  -- Buscar próximo número sequencial do dia
  SELECT COALESCE(MAX(
    CAST(
      substring(protocolo from '[0-9]+$') AS INTEGER
    )
  ), 0) + 1
  INTO _sequence
  FROM office_visits
  WHERE tenant_id = _tenant_id
    AND protocolo LIKE _prefix || '-' || _date || '-%';
  
  -- Formatar protocolo: RP-GB-20251008-0001
  _protocol := _prefix || '-' || _date || '-' || lpad(_sequence::TEXT, 4, '0');
  
  RETURN _protocol;
END;
$$;

-- 9. Função: update_leader_score (atualiza pontuação do líder)
CREATE OR REPLACE FUNCTION public.update_leader_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _settings RECORD;
  _form RECORD;
  _points INTEGER := 0;
BEGIN
  -- Se mudou para FORM_SUBMITTED ou CHECKED_IN, calcular pontos
  IF NEW.status IN ('FORM_SUBMITTED', 'CHECKED_IN') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('FORM_SUBMITTED', 'CHECKED_IN')) THEN
    
    -- Buscar configurações
    SELECT pontos_form_submitted, pontos_aceita_reuniao
    INTO _settings
    FROM office_settings
    WHERE tenant_id = NEW.tenant_id
    LIMIT 1;
    
    -- Pontos base por form submetido
    _points := COALESCE(_settings.pontos_form_submitted, 1);
    
    -- Buscar form para verificar aceita_reuniao
    SELECT aceita_reuniao INTO _form
    FROM office_visit_forms
    WHERE visit_id = NEW.id;
    
    -- Pontos extras se aceita reunião
    IF _form.aceita_reuniao THEN
      _points := _points + COALESCE(_settings.pontos_aceita_reuniao, 3);
    END IF;
    
    -- Atualizar pontuação do líder
    UPDATE office_leaders
    SET pontuacao_total = pontuacao_total + _points
    WHERE id = NEW.leader_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 10. Trigger: updated_at para todas as tabelas
CREATE TRIGGER update_office_cities_updated_at
  BEFORE UPDATE ON public.office_cities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_office_leaders_updated_at
  BEFORE UPDATE ON public.office_leaders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_office_contacts_updated_at
  BEFORE UPDATE ON public.office_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_office_visits_updated_at
  BEFORE UPDATE ON public.office_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_office_visit_forms_updated_at
  BEFORE UPDATE ON public.office_visit_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_office_settings_updated_at
  BEFORE UPDATE ON public.office_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Trigger: atualizar pontuação do líder
CREATE TRIGGER update_leader_score_on_visit
  AFTER INSERT OR UPDATE ON public.office_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leader_score();

-- 12. RLS: Habilitar em todas as tabelas
ALTER TABLE public.office_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_visit_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_settings ENABLE ROW LEVEL SECURITY;

-- 13. RLS Policies: office_cities (leitura pública, admin modifica)
CREATE POLICY "p_office_cities_select"
  ON public.office_cities FOR SELECT
  USING (true);

CREATE POLICY "p_office_cities_modify"
  ON public.office_cities FOR ALL
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR has_role(auth.uid(), 'admin'::app_role, effective_tenant())
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR has_role(auth.uid(), 'admin'::app_role, effective_tenant())
  );

-- 14. RLS Policies: office_leaders (tenant-scoped)
CREATE POLICY "p_office_leaders_select"
  ON public.office_leaders FOR SELECT
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR (tenant_id = effective_tenant() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'atendente'::app_role], effective_tenant()))
  );

CREATE POLICY "p_office_leaders_modify"
  ON public.office_leaders FOR ALL
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR (tenant_id = effective_tenant() AND has_role(auth.uid(), 'admin'::app_role, effective_tenant()))
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR (tenant_id = effective_tenant() AND has_role(auth.uid(), 'admin'::app_role, effective_tenant()))
  );

-- 15. RLS Policies: office_contacts (tenant-scoped)
CREATE POLICY "p_office_contacts_select"
  ON public.office_contacts FOR SELECT
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR (tenant_id = effective_tenant() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'atendente'::app_role], effective_tenant()))
  );

CREATE POLICY "p_office_contacts_modify"
  ON public.office_contacts FOR ALL
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR (tenant_id = effective_tenant() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'atendente'::app_role], effective_tenant()))
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR (tenant_id = effective_tenant() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'atendente'::app_role], effective_tenant()))
  );

-- 16. RLS Policies: office_visits (tenant-scoped)
CREATE POLICY "p_office_visits_select"
  ON public.office_visits FOR SELECT
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR (tenant_id = effective_tenant() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'atendente'::app_role], effective_tenant()))
  );

CREATE POLICY "p_office_visits_modify"
  ON public.office_visits FOR ALL
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR (tenant_id = effective_tenant() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'atendente'::app_role], effective_tenant()))
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR (tenant_id = effective_tenant() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'atendente'::app_role], effective_tenant()))
  );

-- 17. RLS Policies: office_visit_forms (permite INSERT sem auth via token, leitura tenant-scoped)
CREATE POLICY "p_office_visit_forms_insert_public"
  ON public.office_visit_forms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "p_office_visit_forms_select"
  ON public.office_visit_forms FOR SELECT
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR EXISTS (
      SELECT 1 FROM office_visits
      WHERE office_visits.id = office_visit_forms.visit_id
        AND office_visits.tenant_id = effective_tenant()
        AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'atendente'::app_role], effective_tenant())
    )
  );

CREATE POLICY "p_office_visit_forms_update"
  ON public.office_visit_forms FOR UPDATE
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR EXISTS (
      SELECT 1 FROM office_visits
      WHERE office_visits.id = office_visit_forms.visit_id
        AND office_visits.tenant_id = effective_tenant()
        AND has_role(auth.uid(), 'admin'::app_role, effective_tenant())
    )
  );

-- 18. RLS Policies: office_settings (tenant-scoped)
CREATE POLICY "p_office_settings_select"
  ON public.office_settings FOR SELECT
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR (tenant_id = effective_tenant() AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'atendente'::app_role], effective_tenant()))
  );

CREATE POLICY "p_office_settings_modify"
  ON public.office_settings FOR ALL
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR (tenant_id = effective_tenant() AND has_role(auth.uid(), 'admin'::app_role, effective_tenant()))
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'super_user'::app_role], NULL::uuid)
    OR (tenant_id = effective_tenant() AND has_role(auth.uid(), 'admin'::app_role, effective_tenant()))
  );

-- 19. Popular office_cities com RAs do DF
INSERT INTO public.office_cities (codigo_ra, nome) VALUES
  ('RA-01', 'Brasília'),
  ('RA-02', 'Gama'),
  ('RA-03', 'Taguatinga'),
  ('RA-04', 'Brazlândia'),
  ('RA-05', 'Sobradinho'),
  ('RA-06', 'Planaltina'),
  ('RA-07', 'Paranoá'),
  ('RA-08', 'Núcleo Bandeirante'),
  ('RA-09', 'Ceilândia'),
  ('RA-10', 'Guará'),
  ('RA-11', 'Cruzeiro'),
  ('RA-12', 'Samambaia'),
  ('RA-13', 'Santa Maria'),
  ('RA-14', 'São Sebastião'),
  ('RA-15', 'Recanto das Emas'),
  ('RA-16', 'Lago Sul'),
  ('RA-17', 'Riacho Fundo'),
  ('RA-18', 'Lago Norte'),
  ('RA-19', 'Candangolândia'),
  ('RA-20', 'Águas Claras'),
  ('RA-21', 'Riacho Fundo II'),
  ('RA-22', 'Sudoeste/Octogonal'),
  ('RA-23', 'Varjão'),
  ('RA-24', 'Park Way'),
  ('RA-25', 'SCIA'),
  ('RA-26', 'Sobradinho II'),
  ('RA-27', 'Jardim Botânico'),
  ('RA-28', 'Itapoã'),
  ('RA-29', 'SIA'),
  ('RA-30', 'Vicente Pires'),
  ('RA-31', 'Fercal'),
  ('RA-32', 'Sol Nascente/Pôr do Sol'),
  ('RA-33', 'Arniqueira');

-- 20. Comentários para documentação
COMMENT ON TABLE public.office_cities IS 'Cidades e Regiões Administrativas do DF para o módulo Gabinete';
COMMENT ON TABLE public.office_leaders IS 'Líderes comunitários por cidade/região';
COMMENT ON TABLE public.office_contacts IS 'Contatos cadastrados (dedupe por telefone)';
COMMENT ON TABLE public.office_visits IS 'Visitas ao gabinete com protocolo único';
COMMENT ON TABLE public.office_visit_forms IS 'Dados do formulário público preenchido pelos visitantes';
COMMENT ON TABLE public.office_settings IS 'Configurações do módulo Gabinete por tenant';