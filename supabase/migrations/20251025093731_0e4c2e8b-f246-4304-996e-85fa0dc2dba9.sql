-- Remove role column from profiles table (security issue - roles must be in separate table)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Update app_role enum to match user requirements
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'member');

-- Recreate user_roles table with proper structure
DROP TABLE IF EXISTS public.user_roles CASCADE;
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Recreate the has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
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

-- RLS Policies for user_roles
CREATE POLICY "Anyone can view roles"
  ON public.user_roles
  FOR SELECT
  USING (true);

CREATE POLICY "Only Abubakar can manage roles"
  ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.username = 'Abubakar'
    )
  );

-- Create online_users table to track who's logged in
CREATE TABLE IF NOT EXISTS public.online_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.online_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Online users are viewable by everyone"
  ON public.online_users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own status"
  ON public.online_users
  FOR ALL
  USING (auth.uid() = user_id);