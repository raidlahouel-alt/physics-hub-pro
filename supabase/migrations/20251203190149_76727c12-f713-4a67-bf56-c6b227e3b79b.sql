-- Create comments table for student questions and content comments
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_question BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX idx_comments_content_id ON public.comments(content_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_is_question ON public.comments(is_question) WHERE is_question = true;

-- RLS Policies
-- Anyone authenticated can view comments
CREATE POLICY "Authenticated users can view comments"
ON public.comments
FOR SELECT
TO authenticated
USING (true);

-- Users can create their own comments
CREATE POLICY "Users can create own comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON public.comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own comments, teachers can delete any
CREATE POLICY "Users can delete own comments"
ON public.comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'teacher'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Make storage bucket private for better security
UPDATE storage.buckets SET public = false WHERE name = 'content-files';

-- Update storage policies to require authentication
DROP POLICY IF EXISTS "Public can view content files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload content files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete content files" ON storage.objects;

-- New secure storage policies
CREATE POLICY "Authenticated users can view content files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'content-files');

CREATE POLICY "Teachers can upload content files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content-files' AND has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Teachers can update content files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'content-files' AND has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Teachers can delete content files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'content-files' AND has_role(auth.uid(), 'teacher'::app_role));