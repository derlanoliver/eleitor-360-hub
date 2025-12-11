-- Fix search_path for the new functions
ALTER FUNCTION public.generate_checkin_pin() SET search_path = public;
ALTER FUNCTION public.set_checkin_pin() SET search_path = public;
ALTER FUNCTION public.validate_checkin_pin(UUID, TEXT) SET search_path = public;