-- التأكد من أن البكت public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'content-files';