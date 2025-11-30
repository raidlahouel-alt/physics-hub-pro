-- Create enum for student levels
CREATE TYPE student_level AS ENUM ('second_year', 'baccalaureate');

-- Create enum for content type
CREATE TYPE content_type AS ENUM ('lesson', 'summary', 'exercise');

-- Create enum for payment status
CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'rejected');

-- Create enum for payment method
CREATE TYPE payment_method AS ENUM ('ccp', 'golden_card');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  level student_level,
  is_teacher BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create content table (lessons, summaries, exercises)
CREATE TABLE public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content_type content_type NOT NULL,
  level student_level NOT NULL,
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 3),
  file_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  level student_level,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL DEFAULT 2500,
  payment_method payment_method NOT NULL,
  transaction_reference TEXT,
  status payment_status DEFAULT 'pending',
  month_paid_for TEXT NOT NULL,
  receipt_url TEXT,
  confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create storage bucket for content files
INSERT INTO storage.buckets (id, name, public) VALUES ('content-files', 'content-files', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', false);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_teacher = true)
);

-- Content policies (public read for authenticated users)
CREATE POLICY "Authenticated users can view content" ON public.content FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can create content" ON public.content FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_teacher = true)
);
CREATE POLICY "Teachers can update content" ON public.content FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_teacher = true)
);
CREATE POLICY "Teachers can delete content" ON public.content FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_teacher = true)
);

-- Announcements policies
CREATE POLICY "Authenticated users can view announcements" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can manage announcements" ON public.announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_teacher = true)
);

-- Payments policies
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers can view all payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_teacher = true)
);
CREATE POLICY "Teachers can update payments" ON public.payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_teacher = true)
);

-- Storage policies
CREATE POLICY "Anyone can view content files" ON storage.objects FOR SELECT USING (bucket_id = 'content-files');
CREATE POLICY "Teachers can upload content files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'content-files' AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_teacher = true)
);
CREATE POLICY "Users can upload payment receipts" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view their own receipts" ON storage.objects FOR SELECT USING (
  bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Teachers can view all receipts" ON storage.objects FOR SELECT USING (
  bucket_id = 'payment-receipts' AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_teacher = true)
);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email));
  RETURN new;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Timestamp triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON public.content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();