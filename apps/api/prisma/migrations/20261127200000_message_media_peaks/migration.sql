-- NS-047 : onde d'un vocal (barres de 0 à 100), calculée à l'enregistrement. Ajout seul.
ALTER TABLE "Message" ADD COLUMN "mediaPeaks" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
