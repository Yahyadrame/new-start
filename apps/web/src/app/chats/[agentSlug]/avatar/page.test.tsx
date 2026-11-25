import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../features/chats', () => ({
  ContactAvatarScreen: ({ agentSlug }: { agentSlug: string }) => <p>écran {agentSlug}</p>,
}));
const { default: Page } = await import('./page');

describe('/chats/[agentSlug]/avatar', () => {
  it('passe le contact à l’écran', async () => {
    render(await Page({ params: Promise.resolve({ agentSlug: 'jade' }) }));
    expect(screen.getByText('écran jade')).toBeTruthy();
  });
});
