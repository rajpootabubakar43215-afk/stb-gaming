-- Create enum for user roles
DO $$ BEGIN
  CREATE TYPE public.user_role_type AS ENUM ('owner', 'admin', 'moderator', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add role column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.user_role_type DEFAULT 'member';

-- Update Abubakar to owner role
UPDATE public.profiles SET role = 'owner' WHERE username = 'Abubakar';

-- Add username_color column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username_color text DEFAULT '#ffffff';

-- Update RLS policies for announcements to only allow Abubakar
DROP POLICY IF EXISTS "Only Abubakar can create announcements" ON public.announcements;
CREATE POLICY "Only Abubakar can create announcements"
ON public.announcements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.username = 'Abubakar'
  )
);

-- Update user_roles policies to only allow Abubakar to manage
DROP POLICY IF EXISTS "Only Abubakar can add admins" ON public.user_roles;
CREATE POLICY "Only Abubakar can add admins"
ON public.user_roles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.username = 'Abubakar'
  )
);