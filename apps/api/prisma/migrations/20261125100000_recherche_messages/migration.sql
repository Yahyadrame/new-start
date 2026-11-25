-- Étendre : un index de plus, aucune lecture ni écriture existante ne change.
-- Les trigrammes servent la recherche `ILIKE '%mot%'` dans le texte des messages (NS-037).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Message_text_trgm_idx" ON "Message" USING GIN ("text" gin_trgm_ops);
