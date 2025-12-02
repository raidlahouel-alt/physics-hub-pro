-- إضافة حقل التحقق من الهاتف في جدول profiles
ALTER TABLE public.profiles
ALTER COLUMN phone SET NOT NULL,
ADD COLUMN phone_verified BOOLEAN DEFAULT false;

-- تحديث سياسة الإدراج في profiles لتطلب رقم الهاتف
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  phone IS NOT NULL
);

-- تحديث دالة handle_new_user لإضافة الهاتف
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, phone_verified)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone',
    false
  );
  RETURN new;
END;
$function$;

-- إضافة سياسة للمعلمين لحذف ملفات الطلاب
CREATE POLICY "Teachers can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'teacher')
);