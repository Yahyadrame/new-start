type EmojiData = {
  emojis: Record<string, { keywords?: string[] | undefined; skins: { native: string }[] }>;
};
type FrenchEmoji = { unicode: string; label: string; tags?: string[] };

const withoutVariant = (native: string) => native.replaceAll('️', '');
const unaccented = (word: string) =>
  word.normalize('NFD').replace(/\p{M}/gu, '').replaceAll('œ', 'oe');

/** Les formes qu'on peut taper : « d’accord » donne aussi « accord », « éléphant » donne « elephant ». */
function forms(text: string): string[] {
  const words = text.toLowerCase().replaceAll('’', "'").split(/\s+/);
  const parts = words.flatMap((word) => [word, ...word.split(/['-]/)]);
  return parts.filter((p) => p.length > 1).flatMap((p) => [p, unaccented(p)]);
}

/**
 * emoji-mart ne cherche qu'en anglais : on ajoute les mots français à ses mots-clés,
 * pour que « girafe » et « giraffe » trouvent le même émoji. À faire avant son premier affichage,
 * car il construit son index une seule fois.
 */
export function addFrenchKeywords(data: EmojiData, french: FrenchEmoji[]): void {
  const byNative = new Map(french.map((e) => [withoutVariant(e.unicode), e]));
  for (const emoji of Object.values(data.emojis)) {
    const match = byNative.get(withoutVariant(emoji.skins[0]?.native ?? ''));
    if (!match) continue;
    const words = [match.label, ...(match.tags ?? [])].flatMap(forms);
    emoji.keywords = [...new Set([...words, ...(emoji.keywords ?? [])])];
  }
}
