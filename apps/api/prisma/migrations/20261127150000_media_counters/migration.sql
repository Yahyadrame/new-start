-- NS-047 : compteurs du jour des vocaux et des photos (ajouts seulement, avec valeur par défaut).
ALTER TABLE "DailyActivity" ADD COLUMN "voiceSent" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "photosSent" INTEGER NOT NULL DEFAULT 0;
