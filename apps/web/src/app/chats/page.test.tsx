import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

vi.mock('../../features/chats', () => ({ ChatsScreen: () => <p>écran des discussions</p> }));
const { default: ChatsPage } = await import('./page');

it("affiche l'écran des discussions", () => {
  expect(render(<ChatsPage />).getByText('écran des discussions')).toBeTruthy();
});
