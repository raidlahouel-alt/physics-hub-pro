-- Add file_urls column to content table for multiple files support
ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS file_urls jsonb DEFAULT '[]'::jsonb;

-- Migrate existing file_url data to file_urls array
UPDATE public.content 
SET file_urls = jsonb_build_array(file_url) 
WHERE file_url IS NOT NULL AND (file_urls IS NULL OR file_urls = '[]'::jsonb);

-- Add comment for documentation
COMMENT ON COLUMN public.content.file_urls IS 'Array of file URLs for multiple files in a single content item';