-- Étendre : nouvelle table, aucune lecture ni écriture existante ne change.
CREATE TABLE "NotebookEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "original" TEXT NOT NULL,
    "better" TEXT NOT NULL,
    "whyFr" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotebookEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotebookEntry_userId_messageId_key" ON "NotebookEntry"("userId", "messageId");

CREATE INDEX "NotebookEntry_userId_createdAt_idx" ON "NotebookEntry"("userId", "createdAt");

ALTER TABLE "NotebookEntry" ADD CONSTRAINT "NotebookEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
