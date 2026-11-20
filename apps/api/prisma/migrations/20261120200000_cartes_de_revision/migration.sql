-- Étendre : nouvelle table, aucune lecture ni écriture existante ne change.
CREATE TABLE "ReviewCard" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "expressionId" INTEGER NOT NULL,
    "stability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "due" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "lastReview" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewCard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReviewCard_userId_expressionId_key" ON "ReviewCard"("userId", "expressionId");

CREATE INDEX "ReviewCard_userId_due_idx" ON "ReviewCard"("userId", "due");

ALTER TABLE "ReviewCard" ADD CONSTRAINT "ReviewCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewCard" ADD CONSTRAINT "ReviewCard_expressionId_fkey" FOREIGN KEY ("expressionId") REFERENCES "Expression"("id") ON DELETE CASCADE ON UPDATE CASCADE;
