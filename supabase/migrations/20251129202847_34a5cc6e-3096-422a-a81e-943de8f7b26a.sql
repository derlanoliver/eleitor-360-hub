-- Criar tabela de atas de reunião
CREATE TABLE public.office_meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES office_visits(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'file')),
  content_text TEXT,
  file_path TEXT,
  file_name TEXT,
  file_mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(visit_id)
);

-- Habilitar RLS
ALTER TABLE office_meeting_minutes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: admin e atendente podem ver
CREATE POLICY "office_meeting_minutes_select" ON office_meeting_minutes
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'atendente'::app_role));

-- Admin e atendente podem inserir
CREATE POLICY "office_meeting_minutes_insert" ON office_meeting_minutes
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'atendente'::app_role));

-- Admin pode atualizar
CREATE POLICY "office_meeting_minutes_update" ON office_meeting_minutes
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin pode deletar
CREATE POLICY "office_meeting_minutes_delete" ON office_meeting_minutes
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar bucket de storage para atas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('meeting-minutes', 'meeting-minutes', false);

-- RLS para objetos do bucket: admin e atendente podem visualizar
CREATE POLICY "meeting_minutes_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'meeting-minutes' AND 
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'atendente'::app_role))
  );

-- Admin e atendente podem fazer upload
CREATE POLICY "meeting_minutes_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'meeting-minutes' AND 
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'atendente'::app_role))
  );