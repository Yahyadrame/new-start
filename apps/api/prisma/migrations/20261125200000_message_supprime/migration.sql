-- Étendre : une colonne facultative, aucune lecture ni écriture existante ne change (NS-054).
ALTER TABLE "Message" ADD COLUMN "deletedAt" TIMESTAMP(3);
