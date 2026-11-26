import { describe, expect, it } from 'vitest';
import { STICKER_GROUPS, STICKERS, StickerId, stickerText } from './stickers.js';

describe('stickers', () => {
  it('a des identifiants uniques et des légendes en anglais non vides', () => {
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(STICKERS.length);
    expect(STICKERS.length).toBeGreaterThanOrEqual(60);
    for (const s of STICKERS) expect(s.text.trim()).not.toBe('');
  });

  it('range chaque sticker dans un groupe connu, avec quatre pièces', () => {
    for (const s of STICKERS) {
      expect(STICKER_GROUPS).toContain(s.group);
      expect(s.parts).toHaveLength(4);
    }
  });

  it('retrouve la légende par identifiant', () => {
    expect(stickerText('thanks')).toBe('Thanks!');
    expect(stickerText('nope')).toBeUndefined();
    expect(StickerId.safeParse('hmm').success).toBe(true);
    expect(StickerId.safeParse('nope').success).toBe(false);
  });
});
