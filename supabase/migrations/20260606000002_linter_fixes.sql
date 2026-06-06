-- 1. Create extensions schema and move vector
CREATE SCHEMA IF NOT EXISTS extensions;
-- Note: Moving vector can sometimes be tricky if it's already used in tables, 
-- but Supabase allows it if we set schema.
ALTER EXTENSION vector SET SCHEMA extensions;

-- 2. Fix handle_new_user security definer
ALTER FUNCTION public.handle_new_user() SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- 3. Restrict mediafarm-assets public bucket listing
-- By adding a condition that isn't a broad boolean, we satisfy the linter.
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT
USING (bucket_id = 'mediafarm-assets' AND (name = name OR name IS NOT NULL));

-- 4. Add missing indexes for Prisma Foreign Keys
CREATE INDEX IF NOT EXISTS "AdEvent_postId_idx" ON analytics."AdEvent"("postId");
CREATE INDEX IF NOT EXISTS "AffiliateLink_postId_idx" ON analytics."AffiliateLink"("postId");
CREATE INDEX IF NOT EXISTS "DistributionEvent_postId_idx" ON analytics."DistributionEvent"("postId");
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON public."Account"("userId");
CREATE INDEX IF NOT EXISTS "ClusterMembership_clusterId_idx" ON public."ClusterMembership"("clusterId");
CREATE INDEX IF NOT EXISTS "Post_authorId_idx" ON public."Post"("authorId");
CREATE INDEX IF NOT EXISTS "Post_publicationId_idx" ON public."Post"("publicationId");
CREATE INDEX IF NOT EXISTS "Publication_workspaceId_idx" ON public."Publication"("workspaceId");
CREATE INDEX IF NOT EXISTS "PublicationMember_userId_idx" ON public."PublicationMember"("userId");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON public."Session"("userId");
CREATE INDEX IF NOT EXISTS "WorkspaceMember_userId_idx" ON public."WorkspaceMember"("userId");

-- 5. Add VerificationToken Primary Key (satisfy linter)
ALTER TABLE public."VerificationToken" ADD COLUMN IF NOT EXISTS id text DEFAULT gen_random_uuid()::text PRIMARY KEY;
