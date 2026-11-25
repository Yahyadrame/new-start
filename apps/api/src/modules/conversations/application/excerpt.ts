/** Largeur de l'extrait, en caractères, autour du premier mot trouvé. */
const WIDTH = 140;

/** Un extrait du texte centré sur la première occurrence de `query` (sans tenir compte de la casse). */
export function makeExcerpt(text: string, query: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= WIDTH) return flat;
  const at = flat.toLowerCase().indexOf(query.toLowerCase());
  const start = Math.max(0, Math.min((at < 0 ? 0 : at) - 40, flat.length - WIDTH));
  const end = Math.min(flat.length, start + WIDTH);
  return `${start > 0 ? '…' : ''}${flat.slice(start, end)}${end < flat.length ? '…' : ''}`;
}

/** Protège `%`, `_` et `\` pour que la recherche prenne le texte au pied de la lettre. */
export const escapeLike = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);
