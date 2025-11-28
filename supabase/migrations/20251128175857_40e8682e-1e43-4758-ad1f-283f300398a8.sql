-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  capacity INTEGER DEFAULT 100,
  category TEXT NOT NULL,
  region TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  cover_image_url TEXT,
  registrations_count INTEGER DEFAULT 0,
  checkedin_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create event_registrations table
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  cidade_id UUID REFERENCES office_cities(id),
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  qr_code TEXT UNIQUE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_email ON event_registrations(email);
CREATE INDEX idx_event_registrations_qr_code ON event_registrations(qr_code);

-- Create storage bucket for event covers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-covers', 'event-covers', true);

-- Storage policies for event-covers bucket
CREATE POLICY "Event covers are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'event-covers');

CREATE POLICY "Admins can upload event covers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'event-covers' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update event covers" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'event-covers' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete event covers" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'event-covers' 
  AND has_role(auth.uid(), 'admin')
);

-- Function to update registrations count
CREATE OR REPLACE FUNCTION update_event_registrations_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events 
    SET registrations_count = registrations_count + 1,
        updated_at = now()
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events 
    SET registrations_count = registrations_count - 1,
        updated_at = now()
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for registrations count
CREATE TRIGGER trigger_update_registrations_count
AFTER INSERT OR DELETE ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION update_event_registrations_count();

-- Function to update checked-in count
CREATE OR REPLACE FUNCTION update_event_checkedin_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.checked_in = true AND (OLD.checked_in IS NULL OR OLD.checked_in = false) THEN
    UPDATE events 
    SET checkedin_count = checkedin_count + 1,
        updated_at = now()
    WHERE id = NEW.event_id;
  ELSIF NEW.checked_in = false AND OLD.checked_in = true THEN
    UPDATE events 
    SET checkedin_count = checkedin_count - 1,
        updated_at = now()
    WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for checked-in count
CREATE TRIGGER trigger_update_checkedin_count
AFTER UPDATE OF checked_in ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION update_event_checkedin_count();

-- Function to generate unique QR code
CREATE OR REPLACE FUNCTION generate_event_qr_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  _code TEXT;
  _exists BOOLEAN;
BEGIN
  LOOP
    _code := substring(md5(random()::text || clock_timestamp()::text) from 1 for 12);
    
    SELECT EXISTS(SELECT 1 FROM event_registrations WHERE qr_code = _code) INTO _exists;
    
    EXIT WHEN NOT _exists;
  END LOOP;
  
  RETURN _code;
END;
$$;

-- Trigger to set QR code on registration
CREATE OR REPLACE FUNCTION set_registration_qr_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code := generate_event_qr_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_registration_qr_code
BEFORE INSERT ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION set_registration_qr_code();

-- RLS Policies for events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone" 
ON events 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert events" 
ON events 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update events" 
ON events 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete events" 
ON events 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for event_registrations table
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event registrations viewable by admins" 
ON event_registrations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can register for events" 
ON event_registrations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update registrations" 
ON event_registrations 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete registrations" 
ON event_registrations 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));