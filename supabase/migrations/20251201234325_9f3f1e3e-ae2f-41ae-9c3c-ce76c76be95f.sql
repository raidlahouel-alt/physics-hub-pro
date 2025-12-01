-- إصلاح مشاكل RLS وإنشاء نظام أدوار آمن

-- 1. حذف storage policies التي تعتمد على is_teacher أولاً
DROP POLICY IF EXISTS "Teachers can upload content files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view all receipts" ON storage.objects;

-- 2. حذف جميع RLS policies القديمة التي تسبب التكرار اللا نهائي
DROP POLICY IF EXISTS "Teachers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile limited" ON public.profiles;

DROP POLICY IF EXISTS "Authenticated users can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Teachers can manage announcements" ON public.announcements;

DROP POLICY IF EXISTS "Authenticated users can view content" ON public.content;
DROP POLICY IF EXISTS "Teachers can create content" ON public.content;
DROP POLICY IF EXISTS "Teachers can update content" ON public.content;
DROP POLICY IF EXISTS "Teachers can delete content" ON public.content;

-- 3. إنشاء enum للأدوار
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('teacher', 'student');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. إنشاء جدول user_roles إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- تفعيل RLS على user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. إنشاء دالة has_role الآمنة
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. نقل المعلمين الحاليين من profiles إلى user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'teacher'::app_role
FROM public.profiles
WHERE is_teacher = true
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. حذف عمود is_teacher من profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_teacher CASCADE;

-- 8. إنشاء سياسات RLS جديدة آمنة لجدول profiles

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 9. إنشاء سياسات RLS للمحتوى

CREATE POLICY "Authenticated users can view content"
ON public.content FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Teachers can create content"
ON public.content FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can update content"
ON public.content FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can delete content"
ON public.content FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'));

-- 10. إنشاء سياسات RLS للإعلانات

CREATE POLICY "Authenticated users can view active announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Teachers can manage announcements"
ON public.announcements FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'))
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

-- 11. إنشاء سياسات storage جديدة باستخدام has_role

CREATE POLICY "Teachers can upload content files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-files' AND 
  public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Teachers can manage content files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'content-files' AND 
  public.has_role(auth.uid(), 'teacher')
);

-- 12. سياسة لقراءة user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);