-- NS-047 : ajouts seulement, l'ancien code continue de marcher (étendre puis contracter).
ALTER TYPE "MessageKind" ADD VALUE IF NOT EXISTS 'IMAGE';
ALTER TABLE "Message" ADD COLUMN "mediaKey" TEXT, ADD COLUMN "mediaProvider" TEXT, ADD COLUMN "mediaSeconds" INTEGER;
