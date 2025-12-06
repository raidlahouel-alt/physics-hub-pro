-- Drop the restrictive policy
DROP POLICY IF EXISTS "Authenticated users can view active announcements" ON public.announcements;

-- Create a new policy that allows everyone to view active announcements
CREATE POLICY "Anyone can view active announcements" 
ON public.announcements 
FOR SELECT 
USING (is_active = true);