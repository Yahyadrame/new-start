import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);
vi.mock('../../features/notifications', () => ({
  NotificationsScreen: () => <p>écran notifications</p>,
}));
const { default: Page } = await import('./page');

describe('/notifications', () => {
  it('affiche l’écran Notifications', () => {
    expect(render(<Page />).getByText('écran notifications')).toBeTruthy();
  });
});
