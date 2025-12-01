-- Fix RLS policies to prevent privilege escalation
-- Update the profiles table policy to prevent users from changing is_teacher
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile limited" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND is_teacher = (SELECT is_teacher FROM profiles WHERE user_id = auth.uid())
);

-- Remove payment system
DROP TABLE IF EXISTS public.payments CASCADE;

-- Remove payment-receipts storage bucket
DELETE FROM storage.buckets WHERE id = 'payment-receipts';