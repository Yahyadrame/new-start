import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const usePathname = vi.fn();
vi.mock('next/navigation', () => ({ usePathname }));
vi.mock('../../features/chats', () => ({ ChatsScreen: () => <p>liste</p> }));
const { default: ChatsLayout } = await import('./layout');

afterEach(cleanup);

describe('ChatsLayout', () => {
  it('montre la liste et cache le volet de droite sur /chats (mobile)', () => {
    usePathname.mockReturnValue('/chats');
    render(
      <ChatsLayout>
        <p>volet</p>
      </ChatsLayout>,
    );
    expect(screen.getByText('liste').parentElement?.className).not.toContain('hidden');
    expect(screen.getByText('volet').parentElement?.className).toContain('hidden lg:block');
  });

  it('cache la liste sur mobile quand une conversation est ouverte, mais la garde dès 1024 px', () => {
    usePathname.mockReturnValue('/chats/jade');
    render(
      <ChatsLayout>
        <p>volet</p>
      </ChatsLayout>,
    );
    const list = screen.getByText('liste').parentElement?.className ?? '';
    expect(list).toContain('hidden');
    expect(list).toContain('lg:block');
    expect(screen.getByText('volet').parentElement?.className).not.toContain('hidden');
  });
});
