-- Fiche d'un contact (NS-051, partie 2) : trois colonnes ajoutées, sans rien retirer.
ALTER TABLE "Agent" ADD COLUMN "bioFr" TEXT NOT NULL DEFAULT '',
ADD COLUMN "interests" TEXT[],
ADD COLUMN "level" TEXT NOT NULL DEFAULT 'B1';
