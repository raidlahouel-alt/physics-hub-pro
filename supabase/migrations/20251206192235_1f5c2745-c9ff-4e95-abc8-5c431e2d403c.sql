-- Drop existing policies
DROP POLICY IF EXISTS "Public can view active announcements" ON public.announcements;
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;

-- Create new policy for authenticated users only
CREATE POLICY "Authenticated users can view active announcements" 
ON public.announcements 
FOR SELECT 
TO authenticated
USING (is_active = true);