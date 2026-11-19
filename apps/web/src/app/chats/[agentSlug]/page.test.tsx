import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

vi.mock('../../../features/chats', () => ({
  ConversationScreen: ({ agentSlug }: { agentSlug: string }) => <p>conversation {agentSlug}</p>,
}));
const { default: ConversationPage } = await import('./page');

it("passe l'identifiant du contact à l'écran", async () => {
  const ui = await ConversationPage({ params: Promise.resolve({ agentSlug: 'jade' }) });
  expect(render(ui).getByText('conversation jade')).toBeTruthy();
});
