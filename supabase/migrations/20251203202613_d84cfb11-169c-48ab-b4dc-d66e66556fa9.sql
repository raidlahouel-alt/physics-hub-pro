-- Create trigger function to notify students when a new announcement is created
CREATE OR REPLACE FUNCTION public.notify_students_on_announcement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert notification for all students (or specific level if announcement has level)
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT 
    p.user_id,
    'إعلان جديد: ' || NEW.title,
    LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
    'announcement'
  FROM public.profiles p
  WHERE (NEW.level IS NULL OR p.level = NEW.level)
    AND p.user_id != COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid);
  
  RETURN NEW;
END;
$$;

-- Create trigger for announcements
DROP TRIGGER IF EXISTS on_announcement_created ON public.announcements;
CREATE TRIGGER on_announcement_created
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_students_on_announcement();