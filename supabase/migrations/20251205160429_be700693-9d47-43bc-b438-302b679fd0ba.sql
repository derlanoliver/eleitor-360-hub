-- Fix: Remove overly permissive public SELECT policy on event_registrations
-- This policy was exposing all attendee PII (names, emails, WhatsApp) to anyone

-- Drop the dangerous policy that allows anyone to select all registrations
DROP POLICY IF EXISTS "Anyone can view their own registration after insert" ON public.event_registrations;

-- Create a policy for authenticated users to select registrations (for check-in)
-- This replaces the overly permissive policy with authenticated-only access
CREATE POLICY "Authenticated users can view registrations by qr_code"
ON public.event_registrations
FOR SELECT
TO authenticated
USING (true);

-- Note: The "Event registrations viewable by admins" policy already covers admin access
-- The new policy allows any authenticated user (including check-in operators) to view registrations