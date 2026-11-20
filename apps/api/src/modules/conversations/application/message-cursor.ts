export type MessageCursor = { createdAt: Date; id: string };

/** Le curseur est opaque pour le client : date et identifiant du dernier message vu. */
export const encodeCursor = ({ createdAt, id }: MessageCursor) =>
  Buffer.from(`${createdAt.toISOString()}|${id}`).toString('base64url');

/** Renvoie null si le texte n'est pas un curseur que `encodeCursor` a produit. */
export function decodeCursor(raw: string): MessageCursor | null {
  const [iso, id, ...rest] = Buffer.from(raw, 'base64url').toString().split('|');
  const createdAt = new Date(iso ?? '');
  if (!id || rest.length > 0 || Number.isNaN(createdAt.getTime())) return null;
  return { createdAt, id };
}
