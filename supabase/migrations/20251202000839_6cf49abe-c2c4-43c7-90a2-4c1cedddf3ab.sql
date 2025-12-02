-- تعديل سياسة profiles لتسمح بإدراج من dashboard
-- حذف السياسة القديمة التي تتطلب phone
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- إنشاء سياسة جديدة تسمح بإدراج الملف الشخصي
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- السماح للمعلمين بإدراج صفوف في profiles
CREATE POLICY "Teachers can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'teacher'));

-- جعل حقل phone قابل للتعديل لاحقاً
ALTER TABLE public.profiles
ALTER COLUMN phone DROP NOT NULL;

-- تحديث الدالة handle_new_user لتعمل بدون phone إجباري
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
    COALESCE((new.raw_user_meta_data->>'phone')::text IS NOT NULL, false)
  );
  RETURN new;
END;
$function$;