-- Étendre : nouvelle colonne avec valeur par défaut, aucune lecture ni écriture existante ne change.
ALTER TABLE "DailyActivity" ADD COLUMN "challengeDone" BOOLEAN NOT NULL DEFAULT false;
