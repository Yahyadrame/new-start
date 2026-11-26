import { describe, expect, it } from 'vitest';
import { stickerSvg } from './parts';

describe('stickerSvg', () => {
  it('assemble le visage et les quatre pièces', () => {
    const svg = stickerSvg(['happy', 'none', 'smile', 'hearts']);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('<circle cx="50" cy="52" r="40"');
    expect(svg).toContain('M30 49q6-9 12 0');
    expect(svg).toContain('M34 62q16 16 32 0');
  });

  it('ignore une pièce inconnue sans casser le dessin', () => {
    const svg = stickerSvg(['x', 'x', 'x', 'x']);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).not.toContain('undefined');
  });

  it('donne un dessin différent selon les pièces', () => {
    expect(stickerSvg(['dot', 'none', 'flat', 'none'])).not.toBe(
      stickerSvg(['wide', 'up', 'o', 'none']),
    );
  });
});
