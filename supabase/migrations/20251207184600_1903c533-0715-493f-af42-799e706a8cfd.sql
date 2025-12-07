-- Create table for survey AI analyses persistence
CREATE TABLE public.survey_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  total_responses INTEGER,
  leader_responses INTEGER,
  referred_responses INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.survey_analyses ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin access
CREATE POLICY "survey_analyses_select" ON public.survey_analyses 
  FOR SELECT USING (has_admin_access(auth.uid()));

CREATE POLICY "survey_analyses_insert" ON public.survey_analyses 
  FOR INSERT WITH CHECK (has_admin_access(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "survey_analyses_delete" ON public.survey_analyses 
  FOR DELETE USING (has_admin_access(auth.uid()));