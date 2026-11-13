import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../test/a11y';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Badge } from './badge';
import { Input } from './input';
import { Skeleton } from './skeleton';
import { Switch } from './switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

afterEach(cleanup);

describe('Input', () => {
  it('relie son libellé, accepte la saisie et marque l’erreur', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <>
        <label htmlFor="nom">Prénom</label>
        <Input id="nom" aria-invalid onChange={onChange} />
      </>,
    );
    const input = screen.getByLabelText('Prénom');
    fireEvent.change(input, { target: { value: 'Awa' } });
    expect(onChange).toHaveBeenCalled();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    await expectNoA11yViolations(container);
  });
});

describe('Switch', () => {
  it('bascule au clic et expose son état', async () => {
    const onCheckedChange = vi.fn();
    const { container } = render(
      <Switch aria-label="Notifications" onCheckedChange={onCheckedChange} />,
    );
    const toggle = screen.getByRole('switch', { name: 'Notifications' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    await expectNoA11yViolations(container);
  });
});

describe('Tabs', () => {
  it('affiche le panneau de l’onglet actif', async () => {
    const { container } = render(
      <Tabs defaultValue="a">
        <TabsList aria-label="Sections">
          <TabsTrigger value="a">Discussions</TabsTrigger>
          <TabsTrigger value="b">Série</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panneau A</TabsContent>
        <TabsContent value="b">Panneau B</TabsContent>
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'Discussions' }).getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(screen.getByText('Panneau A')).toBeTruthy();
    expect(screen.queryByText('Panneau B')).toBeNull();
    await expectNoA11yViolations(container);
  });
});

describe('Avatar', () => {
  it('montre les initiales quand la photo manque', async () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="/awa.png" alt="Awa" />
        <AvatarFallback>AD</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText('AD')).toBeTruthy();
    await expectNoA11yViolations(container);
  });
});

describe('Badge', () => {
  it('applique la variante, accent par défaut', () => {
    render(
      <>
        <Badge>Nouveau</Badge>
        <Badge variant="neutral">Lu</Badge>
      </>,
    );
    expect(screen.getByText('Nouveau').className).toContain('bg-accent');
    expect(screen.getByText('Lu').className).toContain('bg-surface-2');
  });
});

describe('Skeleton', () => {
  it('est caché des lecteurs d’écran et garde la taille donnée', () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.className).toContain('w-24');
  });
});
