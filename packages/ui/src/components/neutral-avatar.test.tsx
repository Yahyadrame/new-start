import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { NeutralAvatar, resolveAvatar } from './neutral-avatar';

const svgOf = (img: HTMLElement) =>
  decodeURIComponent((img as HTMLImageElement).src.replace('data:image/svg+xml,', ''));

afterEach(cleanup);

describe('NeutralAvatar', () => {
  it('affiche une image nommée pour les lecteurs d’écran', () => {
    render(<NeutralAvatar avatarId="jade" name="Jade" />);
    expect(screen.getByRole('img', { name: 'Jade' })).toBeTruthy();
  });

  it('prend deux tons et un carré arrondi par défaut', () => {
    render(<NeutralAvatar avatarId="jade" name="Jade" />);
    const svg = svgOf(screen.getByRole('img'));
    expect(svg).toContain('rx="26"');
    expect(svg).toContain('#7FA6CC');
  });

  it('respecte la forme, la variante, le thème et la palette demandés', () => {
    render(
      <NeutralAvatar
        avatarId="a010"
        name="x"
        variant="gris"
        shape="rond"
        theme="dark"
        palette="Corail"
      />,
    );
    const svg = svgOf(screen.getByRole('img'));
    expect(svg).toContain('r="50"');
    expect(svg).toContain('#2A2A2A');
  });

  it('ne laisse pas un nom hostile entrer dans le SVG', () => {
    render(<NeutralAvatar avatarId="a001" name={'"><script>alert(1)</script>'} />);
    expect(svgOf(screen.getByRole('img'))).not.toContain('script');
  });

  it('retombe sur la première silhouette de la bibliothèque si l’identifiant est inconnu', () => {
    expect(resolveAvatar('inconnu')).toEqual(resolveAvatar('a001'));
    expect(resolveAvatar('kofi').parts).toContain('beardLight');
    expect(resolveAvatar('a360')).toBeTruthy();
  });

  it('ajoute la classe reçue à la taille par défaut de 44 px', () => {
    render(<NeutralAvatar avatarId="sam" name="Sam" className="size-16" />);
    expect(screen.getByRole('img').className).toContain('size-16');
  });
});
