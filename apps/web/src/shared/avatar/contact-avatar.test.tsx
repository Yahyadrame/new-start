import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ContactAvatar, contactAvatarId } from './contact-avatar';

afterEach(cleanup);

describe('contactAvatarId', () => {
  it('garde la silhouette propre à un contact connu', () => {
    expect(contactAvatarId('jade')).toBe('jade');
  });

  it('donne toujours la même silhouette de la bibliothèque aux autres', () => {
    const id = contactAvatarId('dr-amara');
    expect(id).toMatch(/^a\d{3}$/);
    expect(contactAvatarId('dr-amara')).toBe(id);
  });

  it('ne donne pas la même à tous les contacts sans silhouette', () => {
    const ids = new Set(['zoe', 'theo', 'finn', 'lola', 'iris', 'milo'].map(contactAvatarId));
    expect(ids.size).toBeGreaterThan(3);
  });
});

describe('ContactAvatar', () => {
  it('affiche le nom du contact pour les lecteurs d’écran', () => {
    render(<ContactAvatar slug="jade" name="Jade" className="size-[52px]" />);
    const img = screen.getByRole('img', { name: 'Jade' });
    expect(img.className).toContain('size-[52px]');
    expect(img.getAttribute('src')).toContain('data:image/svg+xml');
  });
});
