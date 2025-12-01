-- إصلاح سياسات storage للسماح بالوصول العام للملفات

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Anyone can view content files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload content files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can manage content files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own receipts" ON storage.objects;

-- سياسة للسماح للجميع (بما في ذلك غير المسجلين) بعرض ملفات المحتوى
CREATE POLICY "Public can view content files"
ON storage.objects FOR SELECT
TO public, anon, authenticated
USING (bucket_id = 'content-files');

-- سياسة للسماح للمعلمين برفع الملفات
CREATE POLICY "Teachers can upload content files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-files' AND 
  public.has_role(auth.uid(), 'teacher')
);

-- سياسة للسماح للمعلمين بإدارة الملفات (تحديث وحذف)
CREATE POLICY "Teachers can manage content files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'content-files' AND 
  public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Teachers can delete content files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'content-files' AND 
  public.has_role(auth.uid(), 'teacher')
);