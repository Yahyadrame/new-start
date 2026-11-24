import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import manifest from './manifest';

/** Octets 17 à 24 d'un PNG : largeur puis hauteur ; l'octet 25 donne le type de couleur (2 = RVB, 6 = RVBA). */
const png = (path: string) => {
  const b = readFileSync(new URL(path, import.meta.url));
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), colorType: b[25] };
};

describe('manifest', () => {
  const m = manifest();
  it("s'ouvre comme une application, sur les discussions", () => {
    expect(m.name).toBe('New Start');
    expect(m.display).toBe('standalone');
    expect(m.start_url).toBe('/chats');
  });
  it('déclare des icônes qui existent, à la taille annoncée, sans transparence', () => {
    for (const icon of m.icons ?? []) {
      const { width, height, colorType } = png(`../../public${icon.src}`);
      expect(`${width}x${height}`).toBe(icon.sizes);
      expect(colorType).toBe(2);
    }
  });
  it('propose une icône « maskable »', () => {
    expect(m.icons?.some((i) => i.purpose === 'maskable')).toBe(true);
  });
});

describe('apple-icon', () => {
  it("est un PNG de 180 px, plein : l'iPhone remplit la transparence en noir", () => {
    const { width, height, colorType } = png('./apple-icon.png');
    expect([width, height, colorType]).toEqual([180, 180, 2]);
  });
});
