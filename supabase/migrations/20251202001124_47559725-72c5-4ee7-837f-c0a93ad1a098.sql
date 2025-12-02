-- إضافة سياسات للسماح للمعلمين بإدارة user_roles
-- السماح للمعلمين بإضافة أدوار
CREATE POLICY "Teachers can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'teacher')
);

-- السماح للمعلمين بحذف أدوار
CREATE POLICY "Teachers can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'teacher')
);

-- السماح للمعلمين بعرض جميع الأدوار
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'teacher')
);