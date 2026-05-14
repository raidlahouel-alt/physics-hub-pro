
CREATE TABLE public.platform_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  rater_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  target TEXT NOT NULL DEFAULT 'platform',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  IF NEW.target NOT IN ('platform', 'teacher') THEN
    RAISE EXCEPTION 'target must be platform or teacher';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_platform_rating
BEFORE INSERT OR UPDATE ON public.platform_ratings
FOR EACH ROW EXECUTE FUNCTION public.validate_rating();

CREATE TRIGGER update_platform_ratings_updated_at
BEFORE UPDATE ON public.platform_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.platform_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
ON public.platform_ratings FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert ratings"
ON public.platform_ratings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own rating"
ON public.platform_ratings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rating, teachers any"
ON public.platform_ratings FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'teacher'::app_role));

CREATE INDEX idx_platform_ratings_target ON public.platform_ratings(target);
CREATE INDEX idx_platform_ratings_created_at ON public.platform_ratings(created_at DESC);
