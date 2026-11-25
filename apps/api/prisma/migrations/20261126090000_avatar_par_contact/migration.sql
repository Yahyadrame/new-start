-- Étendre : nouvelle table, aucune colonne existante touchée. Rien à contracter.
CREATE TABLE "ContactAvatar" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "avatar" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContactAvatar_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContactAvatar_userId_agentId_key" ON "ContactAvatar"("userId", "agentId");
ALTER TABLE "ContactAvatar" ADD CONSTRAINT "ContactAvatar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactAvatar" ADD CONSTRAINT "ContactAvatar_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
