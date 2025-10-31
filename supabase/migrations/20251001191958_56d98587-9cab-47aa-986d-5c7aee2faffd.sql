-- Fix overpermissive RLS policy on user_sessions table
-- Drop the current overpermissive policy
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.user_sessions;

-- Create user-specific policy for SELECT
CREATE POLICY "Users can view own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (user_id = auth.uid());

-- Create user-specific policy for INSERT
CREATE POLICY "Users can create own sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create user-specific policy for UPDATE
CREATE POLICY "Users can update own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create user-specific policy for DELETE
CREATE POLICY "Users can delete own sessions" 
ON public.user_sessions 
FOR DELETE 
USING (user_id = auth.uid());