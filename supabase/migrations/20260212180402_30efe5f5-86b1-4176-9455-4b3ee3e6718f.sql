
ALTER TABLE public.events ADD COLUMN created_by_coordinator_id UUID REFERENCES public.lideres(id);

CREATE INDEX idx_events_created_by_coordinator ON public.events(created_by_coordinator_id);
