-- Étendre : une colonne avec valeur par défaut. Les comptes existants restent sur le fond uni et
-- l'ancienne version de l'API, qui ne la lit pas, continue de fonctionner. Rien à contracter.
ALTER TABLE "User" ADD COLUMN "chatBackground" TEXT NOT NULL DEFAULT 'NONE';
