-- Étendre : nouveaux objectifs, objectifs et centres d'intérêt multiples (colonnes facultatives).
ALTER TYPE "Goal" ADD VALUE IF NOT EXISTS 'STUDIES';
ALTER TYPE "Goal" ADD VALUE IF NOT EXISTS 'EXAMS';
ALTER TYPE "Goal" ADD VALUE IF NOT EXISTS 'BUSINESS';
ALTER TYPE "Goal" ADD VALUE IF NOT EXISTS 'CULTURE';

ALTER TABLE "User" ADD COLUMN "goals" "Goal"[] DEFAULT ARRAY[]::"Goal"[];
ALTER TABLE "User" ADD COLUMN "interests" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Les comptes existants gardent leur objectif unique dans la nouvelle liste.
UPDATE "User" SET "goals" = ARRAY["goal"];
