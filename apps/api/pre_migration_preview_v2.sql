-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "analytics";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "entity";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "integration";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "registry";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'author',
    "bio" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'personal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationMember" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'author',

    CONSTRAINT "PublicationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "authorId" TEXT NOT NULL,
    "publicationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "tier" TEXT NOT NULL DEFAULT 'tier_1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "rpmReal" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "cpmReal" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "revenueTotal" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "editorialBoost" INTEGER NOT NULL DEFAULT 0,
    "trustScore" INTEGER NOT NULL DEFAULT 50,
    "rankingScore" DOUBLE PRECISION,
    "attentionScore" DOUBLE PRECISION,
    "entityScore" DOUBLE PRECISION,
    "commercialIntentScore" DOUBLE PRECISION,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."AdEvent" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "impression" BOOLEAN NOT NULL DEFAULT false,
    "click" BOOLEAN NOT NULL DEFAULT false,
    "conversion" BOOLEAN NOT NULL DEFAULT false,
    "revenueValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration"."RssSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fetchInterval" INTEGER NOT NULL DEFAULT 30,
    "lastFetched" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "RssSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration"."RssEntry" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "RssEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration"."ApiSource" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "ApiSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration"."ContentCandidate" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "title" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "extractedTags" TEXT,
    "normalizedData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicCluster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parent" TEXT,

    CONSTRAINT "TopicCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClusterMembership" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'spoke',

    CONSTRAINT "ClusterMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoMetadata" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "canonicalUrl" TEXT,
    "openGraph" TEXT,
    "twitterCard" TEXT,
    "jsonLd" TEXT,

    CONSTRAINT "SeoMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."DistributionEvent" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DistributionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."AffiliateLink" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "productUrl" TEXT NOT NULL,
    "affiliateUrl" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "AffiliateLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."ContentMetric" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "sessionDepthAvg" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "returningUsers" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "timeOnPageAvg" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "ContentMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."AuthorMetric" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "totalReads" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "followerCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AuthorMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."TopicMetric" (
    "id" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "organicTraffic" INTEGER NOT NULL DEFAULT 0,
    "clusterRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "rankingKeywords" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TopicMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry"."FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry"."NavigationRegistry" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "schema" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry"."TaxonomyRegistry" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "schema" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxonomyRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry"."PageRegistry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry"."WidgetRegistry" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "schema" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WidgetRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry"."RouteRegistry" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouteRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry"."EngineRegistry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 100,
    "capabilities" JSONB,
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngineRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry"."SystemConfiguration" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'global',
    "environment" TEXT NOT NULL DEFAULT 'production',
    "workspaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."EventEnvelope" (
    "eventId" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "correlationId" TEXT,
    "causationId" TEXT,
    "aggregateId" TEXT,
    "aggregateType" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "engineId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT,
    "payload" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventEnvelope_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "analytics"."PipelineHealth" (
    "id" TEXT NOT NULL,
    "engineId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "queueDepth" INTEGER NOT NULL DEFAULT 0,
    "errorRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "throughput" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "avgExecutionMs" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "p95ExecutionMs" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lastError" TEXT,
    "lastExecutionAt" TIMESTAMP(3),

    CONSTRAINT "PipelineHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry"."RankingProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "weights" JSONB NOT NULL,
    "workspaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "RankingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry"."RankingFactor" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "defaultWeight" DOUBLE PRECISION,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "normalizationMethod" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RankingFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."RankingDecisionLog" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "traceId" TEXT,
    "correlationId" TEXT,
    "experimentId" TEXT,
    "context" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankingDecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."EngagementEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngagementEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."IntegritySignal" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "trustedEngagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "fraudProbability" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "botDetectionSignal" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "engagementQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "sessionQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "attentionAuthenticityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegritySignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry"."RevenueRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "action" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "workspaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity"."EntityNode" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" JSONB,
    "authorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "popularityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "velocityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity"."EntityRelationship" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "EntityRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."RankingSnapshot" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "profileVersion" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "snapshotVersion" INTEGER NOT NULL DEFAULT 1,
    "snapshotDate" DATE NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,

    CONSTRAINT "RankingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."RevenueExecution" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "executionTimeMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."EngineExecutionLog" (
    "id" TEXT NOT NULL,
    "engineId" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "executionMs" INTEGER,
    "input" JSONB,
    "output" JSONB,
    "error" JSONB,
    "expiresAt" TIMESTAMP(3),
    "retentionDays" INTEGER DEFAULT 30,

    CONSTRAINT "EngineExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry"."RankingExperiment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "controlProfileId" TEXT NOT NULL,
    "variantProfileId" TEXT NOT NULL,
    "trafficPercentage" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "RankingExperiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PostToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PostToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Publication_slug_key" ON "Publication"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationMember_publicationId_userId_key" ON "PublicationMember"("publicationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RssSource_url_key" ON "integration"."RssSource"("url");

-- CreateIndex
CREATE UNIQUE INDEX "RssEntry_url_key" ON "integration"."RssEntry"("url");

-- CreateIndex
CREATE UNIQUE INDEX "ApiSource_provider_key" ON "integration"."ApiSource"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "TopicCluster_name_key" ON "TopicCluster"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TopicCluster_slug_key" ON "TopicCluster"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ClusterMembership_postId_clusterId_key" ON "ClusterMembership"("postId", "clusterId");

-- CreateIndex
CREATE UNIQUE INDEX "SeoMetadata_postId_key" ON "SeoMetadata"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentMetric_postId_key" ON "analytics"."ContentMetric"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthorMetric_authorId_key" ON "analytics"."AuthorMetric"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicMetric_clusterId_key" ON "analytics"."TopicMetric"("clusterId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "registry"."FeatureFlag"("key");

-- CreateIndex
CREATE UNIQUE INDEX "NavigationRegistry_key_key" ON "registry"."NavigationRegistry"("key");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyRegistry_key_key" ON "registry"."TaxonomyRegistry"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PageRegistry_slug_key" ON "registry"."PageRegistry"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WidgetRegistry_key_key" ON "registry"."WidgetRegistry"("key");

-- CreateIndex
CREATE UNIQUE INDEX "RouteRegistry_path_key" ON "registry"."RouteRegistry"("path");

-- CreateIndex
CREATE UNIQUE INDEX "EngineRegistry_slug_key" ON "registry"."EngineRegistry"("slug");

-- CreateIndex
CREATE INDEX "SystemConfiguration_workspaceId_idx" ON "registry"."SystemConfiguration"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfiguration_key_workspaceId_environment_key" ON "registry"."SystemConfiguration"("key", "workspaceId", "environment");

-- CreateIndex
CREATE INDEX "EventEnvelope_traceId_idx" ON "analytics"."EventEnvelope"("traceId");

-- CreateIndex
CREATE INDEX "EventEnvelope_engineId_idx" ON "analytics"."EventEnvelope"("engineId");

-- CreateIndex
CREATE INDEX "EventEnvelope_correlationId_idx" ON "analytics"."EventEnvelope"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineHealth_engineId_key" ON "analytics"."PipelineHealth"("engineId");

-- CreateIndex
CREATE INDEX "RankingProfile_workspaceId_idx" ON "registry"."RankingProfile"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "RankingProfile_name_version_workspaceId_key" ON "registry"."RankingProfile"("name", "version", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "RankingFactor_slug_key" ON "registry"."RankingFactor"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "IntegritySignal_sessionId_key" ON "analytics"."IntegritySignal"("sessionId");

-- CreateIndex
CREATE INDEX "RevenueRule_workspaceId_idx" ON "registry"."RevenueRule"("workspaceId");

-- CreateIndex
CREATE INDEX "_PostToTag_B_index" ON "_PostToTag"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationMember" ADD CONSTRAINT "PublicationMember_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationMember" ADD CONSTRAINT "PublicationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."AdEvent" ADD CONSTRAINT "AdEvent_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClusterMembership" ADD CONSTRAINT "ClusterMembership_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClusterMembership" ADD CONSTRAINT "ClusterMembership_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "TopicCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoMetadata" ADD CONSTRAINT "SeoMetadata_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."DistributionEvent" ADD CONSTRAINT "DistributionEvent_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."AffiliateLink" ADD CONSTRAINT "AffiliateLink_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."ContentMetric" ADD CONSTRAINT "ContentMetric_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."AuthorMetric" ADD CONSTRAINT "AuthorMetric_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."TopicMetric" ADD CONSTRAINT "TopicMetric_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "TopicCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registry"."SystemConfiguration" ADD CONSTRAINT "SystemConfiguration_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."EventEnvelope" ADD CONSTRAINT "EventEnvelope_engineId_fkey" FOREIGN KEY ("engineId") REFERENCES "registry"."EngineRegistry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."PipelineHealth" ADD CONSTRAINT "PipelineHealth_engineId_fkey" FOREIGN KEY ("engineId") REFERENCES "registry"."EngineRegistry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registry"."RankingProfile" ADD CONSTRAINT "RankingProfile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registry"."RevenueRule" ADD CONSTRAINT "RevenueRule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registry"."RankingExperiment" ADD CONSTRAINT "RankingExperiment_controlProfileId_fkey" FOREIGN KEY ("controlProfileId") REFERENCES "registry"."RankingProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registry"."RankingExperiment" ADD CONSTRAINT "RankingExperiment_variantProfileId_fkey" FOREIGN KEY ("variantProfileId") REFERENCES "registry"."RankingProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToTag" ADD CONSTRAINT "_PostToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToTag" ADD CONSTRAINT "_PostToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

