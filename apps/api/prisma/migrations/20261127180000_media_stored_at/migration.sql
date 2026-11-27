-- NS-047 : date de rangement d'un fichier repris par un transfert (ajout seulement, facultatif).
ALTER TABLE "Message" ADD COLUMN "mediaStoredAt" TIMESTAMP(3);
