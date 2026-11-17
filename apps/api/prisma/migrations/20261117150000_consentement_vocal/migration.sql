-- Étendre : colonne facultative, aucune lecture existante ne casse.
ALTER TABLE "User" ADD COLUMN "voiceConsentAt" TIMESTAMP(3);
