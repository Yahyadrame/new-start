import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

vi.mock('../../../features/chats', () => ({
  ConversationScreen: ({
    agentSlug,
    focusMessageId,
  }: {
    agentSlug: string;
    focusMessageId?: string;
  }) => (
    <p>
      conversation {agentSlug} {focusMessageId ?? 'sans message'}
    </p>
  ),
}));
const { default: ConversationPage } = await import('./page');

const params = Promise.resolve({ agentSlug: 'jade' });

it("passe l'identifiant du contact à l'écran", async () => {
  const ui = await ConversationPage({ params, searchParams: Promise.resolve({}) });
  expect(render(ui).getByText('conversation jade sans message')).toBeTruthy();
});

it('passe le message demandé par la recherche', async () => {
  const ui = await ConversationPage({ params, searchParams: Promise.resolve({ message: 'm7' }) });
  expect(render(ui).getByText('conversation jade m7')).toBeTruthy();
});

it('prend le premier quand le paramètre est répété', async () => {
  const ui = await ConversationPage({
    params,
    searchParams: Promise.resolve({ message: ['m1', 'm2'] }),
  });
  expect(render(ui).getByText('conversation jade m1')).toBeTruthy();
});
