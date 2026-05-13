-- CreateTable
CREATE TABLE "SeoProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "repoUrl" TEXT,
    "market" TEXT NOT NULL DEFAULT 'FR',
    "type" TEXT NOT NULL,
    "businessGoal" TEXT NOT NULL,
    "integrationsEnc" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Keyword" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "cluster" TEXT,
    "intent" TEXT,
    "isMoneyKeyword" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "volume" INTEGER,
    "cpc" DOUBLE PRECISION,
    "difficulty" DOUBLE PRECISION,
    "priorityScore" DOUBLE PRECISION,
    "associatedPageId" TEXT,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoPage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "url" TEXT,
    "slug" TEXT,
    "pageType" TEXT,
    "targetKeyword" TEXT,
    "cluster" TEXT,
    "status" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "h1" TEXT,
    "wordCount" INTEGER,
    "indexable" BOOLEAN,
    "canonical" TEXT,
    "hasJsonLd" BOOLEAN,
    "hasFaq" BOOLEAN,
    "hasCta" BOOLEAN,
    "technicalScore" DOUBLE PRECISION,
    "contentScore" DOUBLE PRECISION,
    "geoScore" DOUBLE PRECISION,
    "conversionScore" DOUBLE PRECISION,

    CONSTRAINT "SeoPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoAudit" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "globalScore" DOUBLE PRECISION,
    "technicalScore" DOUBLE PRECISION,
    "contentScore" DOUBLE PRECISION,
    "architectureScore" DOUBLE PRECISION,
    "conversionScore" DOUBLE PRECISION,
    "geoScore" DOUBLE PRECISION,
    "findingsJson" JSONB NOT NULL,
    "backlogJson" JSONB NOT NULL,
    "runLog" JSONB,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeoAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "pageUrl" TEXT,
    "filePath" TEXT,
    "rule" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT,
    "serpFrequency" INTEGER,
    "notesJson" JSONB,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacklogItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "effort" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "acceptanceCriteria" JSONB,
    "claudePrompt" TEXT,
    "sourceFindingId" TEXT,
    "filePathsTargeted" JSONB,
    "testsExpected" JSONB,
    "definitionOfDone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BacklogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SerpResult" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "market" TEXT NOT NULL DEFAULT 'FR',
    "rank" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "snippet" TEXT,
    "domain" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SerpResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SerpPAA" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SerpPAA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GscQueryStat" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "query" TEXT,
    "page" TEXT,
    "clicks" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "GscQueryStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeoProject_domain_idx" ON "SeoProject"("domain");

-- CreateIndex
CREATE INDEX "Keyword_projectId_cluster_idx" ON "Keyword"("projectId", "cluster");

-- CreateIndex
CREATE INDEX "Keyword_query_idx" ON "Keyword"("query");

-- CreateIndex
CREATE INDEX "SeoPage_projectId_status_idx" ON "SeoPage"("projectId", "status");

-- CreateIndex
CREATE INDEX "SeoAudit_projectId_createdAt_idx" ON "SeoAudit"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "Finding_projectId_severity_idx" ON "Finding"("projectId", "severity");

-- CreateIndex
CREATE INDEX "Finding_auditId_idx" ON "Finding"("auditId");

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_projectId_domain_key" ON "Competitor"("projectId", "domain");

-- CreateIndex
CREATE INDEX "BacklogItem_projectId_priority_idx" ON "BacklogItem"("projectId", "priority");

-- CreateIndex
CREATE INDEX "BacklogItem_projectId_status_idx" ON "BacklogItem"("projectId", "status");

-- CreateIndex
CREATE INDEX "SerpResult_projectId_keyword_fetchedAt_idx" ON "SerpResult"("projectId", "keyword", "fetchedAt");

-- CreateIndex
CREATE INDEX "SerpPAA_projectId_keyword_idx" ON "SerpPAA"("projectId", "keyword");

-- CreateIndex
CREATE INDEX "GscQueryStat_projectId_date_idx" ON "GscQueryStat"("projectId", "date");

-- CreateIndex
CREATE INDEX "GscQueryStat_projectId_query_idx" ON "GscQueryStat"("projectId", "query");

-- CreateIndex
CREATE INDEX "GscQueryStat_projectId_page_idx" ON "GscQueryStat"("projectId", "page");

-- AddForeignKey
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SeoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoPage" ADD CONSTRAINT "SeoPage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SeoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoAudit" ADD CONSTRAINT "SeoAudit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SeoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SeoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "SeoAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SeoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SeoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_sourceFindingId_fkey" FOREIGN KEY ("sourceFindingId") REFERENCES "Finding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
