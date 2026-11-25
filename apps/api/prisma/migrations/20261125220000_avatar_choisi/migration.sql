-- Étendre : choix d'avatar (colonne facultative, null = silhouette grise par défaut). Rien à contracter.
ALTER TABLE "User" ADD COLUMN "avatar" JSONB;
