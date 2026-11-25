import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../features/chats', () => ({
  ContactProfileScreen: ({ agentSlug }: { agentSlug: string }) => <p>fiche {agentSlug}</p>,
}));
const { default: Page } = await import('./page');

describe('/chats/[agentSlug]/profile', () => {
  it('passe le contact à l’écran', async () => {
    render(await Page({ params: Promise.resolve({ agentSlug: 'jade' }) }));
    expect(screen.getByText('fiche jade')).toBeTruthy();
  });
});
