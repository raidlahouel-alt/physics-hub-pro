-- First drop the existing policy
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;

-- Create a PERMISSIVE policy (default) that allows anyone to view active announcements
CREATE POLICY "Public can view active announcements" 
ON public.announcements 
FOR SELECT 
TO public
USING (is_active = true);