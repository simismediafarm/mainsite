-- 1. Create Storage Bucket for MediaFarm Assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mediafarm-assets', 'mediafarm-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'mediafarm-assets');

CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'mediafarm-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own uploads" ON storage.objects FOR UPDATE
USING (
  bucket_id = 'mediafarm-assets' 
  AND auth.uid() = owner
);

CREATE POLICY "Users can delete their own uploads" ON storage.objects FOR DELETE
USING (
  bucket_id = 'mediafarm-assets' 
  AND auth.uid() = owner
);

-- 3. Trigger to sync auth.users to public."User" and public."Profile"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public."User" (NextAuth compatible table)
  INSERT INTO public."User" (id, email, name, role, "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_app_meta_data->>'role', 'member'),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert into public."Profile" (Creator Profile)
  INSERT INTO public."Profile" (id, "userId", name, role, "createdAt")
  VALUES (
    NEW.id, -- We use the same UUID for Profile ID to simplify things
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
    'author',
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
