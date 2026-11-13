import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../test/a11y';
import { cn } from '../lib/cn';
import { Button } from './button';

afterEach(cleanup);

describe('Button', () => {
  it('est un vrai bouton de type button par défaut', () => {
    render(<Button>Envoyer</Button>);
    expect(screen.getByRole('button', { name: 'Envoyer' }).getAttribute('type')).toBe('button');
  });
  it('appelle onClick, sauf désactivé', () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Ok</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(
      <Button disabled onClick={onClick}>
        Ok
      </Button>,
    );
    expect(screen.getByRole('button').hasAttribute('disabled')).toBe(true);
  });
  it('applique la variante et la taille, la classe de l’appelant l’emporte', () => {
    render(
      <Button variant="danger" size="lg" className="px-2">
        Supprimer
      </Button>,
    );
    const { className } = screen.getByRole('button');
    expect(className).toContain('bg-danger');
    expect(className).toContain('min-h-14');
    expect(className).toContain('px-2');
    expect(className).not.toContain('px-6');
  });
  it('rend un lien avec les styles du bouton avec asChild', () => {
    render(
      <Button asChild>
        <a href="/accueil">Accueil</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Accueil' });
    expect(link.className).toContain('bg-accent');
    expect(link.hasAttribute('type')).toBe(false);
  });
  it('n’a aucune violation d’accessibilité, avec ou sans icône seule nommée', async () => {
    const { container } = render(
      <>
        <Button>Texte</Button>
        <Button size="icon" aria-label="Fermer">
          x
        </Button>
      </>,
    );
    await expectNoA11yViolations(container);
  });
  it('détecte un bouton sans nom', async () => {
    const { container } = render(<Button size="icon" />);
    await expect(expectNoA11yViolations(container)).rejects.toThrow('button-name');
  });
});

describe('cn', () => {
  it('ignore les valeurs fausses et résout les conflits Tailwind', () => {
    expect(cn('p-2', { hidden: false }, 'p-4')).toBe('p-4');
  });
});
