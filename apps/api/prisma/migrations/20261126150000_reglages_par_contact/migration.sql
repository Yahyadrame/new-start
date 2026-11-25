-- Étendre : nouvelle table, aucune colonne existante touchée. Rien à contracter.
CREATE TABLE "ContactVariant" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "tone" TEXT,
    "difficulty" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContactVariant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContactVariant_userId_agentId_key" ON "ContactVariant"("userId", "agentId");
ALTER TABLE "ContactVariant" ADD CONSTRAINT "ContactVariant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactVariant" ADD CONSTRAINT "ContactVariant_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
