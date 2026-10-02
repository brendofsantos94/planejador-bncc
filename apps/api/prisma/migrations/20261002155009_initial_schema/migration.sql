-- CreateEnum
CREATE TYPE "AiRunStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('n8n', 'mock');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('RASCUNHO');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refreshTokenHash" VARCHAR(64) NOT NULL,
    "lastSeenAt" TIMESTAMPTZ(3) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BnccSkill" (
    "id" UUID NOT NULL,
    "nivel" VARCHAR(120) NOT NULL,
    "ano" INTEGER,
    "eixo" VARCHAR(160) NOT NULL,
    "codigo" VARCHAR(24) NOT NULL,
    "descricao" TEXT NOT NULL,
    "explicacao" TEXT NOT NULL,
    "exemplos" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "BnccSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRun" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "status" "AiRunStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "AiProvider" NOT NULL,
    "errorCode" VARCHAR(80),
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "aiRunId" UUID NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "markdown" TEXT NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'RASCUNHO',
    "aiAssisted" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "lastSavedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanSkill" (
    "planId" UUID NOT NULL,
    "skillId" UUID NOT NULL,

    CONSTRAINT "PlanSkill_pkey" PRIMARY KEY ("planId","skillId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshTokenHash_key" ON "Session"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "BnccSkill_codigo_key" ON "BnccSkill"("codigo");

-- CreateIndex
CREATE INDEX "BnccSkill_nivel_ano_eixo_idx" ON "BnccSkill"("nivel", "ano", "eixo");

-- CreateIndex
CREATE INDEX "BnccSkill_eixo_idx" ON "BnccSkill"("eixo");

-- CreateIndex
CREATE UNIQUE INDEX "AiRun_requestId_key" ON "AiRun"("requestId");

-- CreateIndex
CREATE INDEX "AiRun_userId_createdAt_idx" ON "AiRun"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiRun_status_createdAt_idx" ON "AiRun"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_aiRunId_key" ON "Plan"("aiRunId");

-- CreateIndex
CREATE INDEX "Plan_ownerId_updatedAt_idx" ON "Plan"("ownerId", "updatedAt");

-- CreateIndex
CREATE INDEX "Plan_ownerId_status_idx" ON "Plan"("ownerId", "status");

-- CreateIndex
CREATE INDEX "PlanSkill_skillId_idx" ON "PlanSkill"("skillId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_aiRunId_fkey" FOREIGN KEY ("aiRunId") REFERENCES "AiRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSkill" ADD CONSTRAINT "PlanSkill_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSkill" ADD CONSTRAINT "PlanSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "BnccSkill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
