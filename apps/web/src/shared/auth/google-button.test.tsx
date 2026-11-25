import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../i18n/fr.json';
import { GoogleSignInError } from './google-api';

const push = vi.hoisted(() => vi.fn());
const signIn = vi.hoisted(() => vi.fn());
const setSession = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('./google-api', async (orig) => ({
  ...(await orig<typeof import('./google-api')>()),
  signInWithGoogle: signIn,
}));
vi.mock('./session', () => ({ setSession }));
const { GoogleButton, googleMessage, isDarkTheme } = await import('./google-button');
const t = fr.google;

let callback: (r: { credential: string }) => Promise<void>;
const renderButton = vi.fn();
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'cid');
  (window as unknown as { google: unknown }).google = {
    accounts: {
      id: {
        initialize: (o: { callback: typeof callback }) => (callback = o.callback),
        renderButton,
      },
    },
  };
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  delete (window as unknown as { google?: unknown }).google;
});

describe('GoogleButton', () => {
  it('n’affiche rien sans identifiant client', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', '');
    render(<GoogleButton redirectTo="/chats" onError={vi.fn()} />);
    expect(screen.queryByTestId('google-button')).toBeNull();
  });

  it('dessine le bouton de Google', async () => {
    render(<GoogleButton redirectTo="/chats" onError={vi.fn()} />);
    await waitFor(() => expect(renderButton).toHaveBeenCalled());
    expect(screen.getByText(t.or)).toBeTruthy();
  });

  it('choisit le bouton sombre selon data-theme, puis selon le système', async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const { unmount } = render(<GoogleButton redirectTo="/chats" onError={vi.fn()} />);
    await waitFor(() => expect(renderButton).toHaveBeenCalled());
    expect(renderButton.mock.calls[0]?.[1]).toMatchObject({ theme: 'filled_black' });
    unmount();
    renderButton.mockClear();
    document.documentElement.setAttribute('data-theme', 'light');
    render(<GoogleButton redirectTo="/chats" onError={vi.fn()} />);
    await waitFor(() => expect(renderButton).toHaveBeenCalled());
    expect(renderButton.mock.calls[0]?.[1]).toMatchObject({ theme: 'outline' });
    document.documentElement.removeAttribute('data-theme');
  });

  it('suit le réglage du système quand aucun thème n’est choisi', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    expect(isDarkTheme()).toBe(true);
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    expect(isDarkTheme()).toBe(false);
    vi.unstubAllGlobals();
  });

  it('ouvre la session puis redirige', async () => {
    signIn.mockResolvedValue({ accessToken: 'a' });
    render(<GoogleButton redirectTo="/chats" onError={vi.fn()} />);
    await waitFor(() => expect(callback).toBeDefined());
    await callback({ credential: 'tok' });
    expect(signIn).toHaveBeenCalledWith('tok', undefined);
    expect(setSession).toHaveBeenCalledWith({ accessToken: 'a' });
    expect(push).toHaveBeenCalledWith('/chats');
  });

  it('envoie le profil saisi à l’inscription', async () => {
    signIn.mockResolvedValue({});
    const profile = { firstName: 'Awa' };
    render(<GoogleButton redirectTo="/x" getProfile={() => profile as never} onError={vi.fn()} />);
    await waitFor(() => expect(callback).toBeDefined());
    await callback({ credential: 'tok' });
    expect(signIn).toHaveBeenCalledWith('tok', profile);
  });

  it('demande de finir l’inscription quand le profil est incomplet', async () => {
    const onError = vi.fn();
    render(<GoogleButton redirectTo="/x" getProfile={() => null} onError={onError} />);
    await waitFor(() => expect(callback).toBeDefined());
    await callback({ credential: 'tok' });
    expect(onError).toHaveBeenLastCalledWith(t.errors.profile);
    expect(signIn).not.toHaveBeenCalled();
  });

  it('affiche l’erreur de l’API', async () => {
    signIn.mockRejectedValue(new GoogleSignInError(404));
    const onError = vi.fn();
    render(<GoogleButton redirectTo="/x" onError={onError} />);
    await waitFor(() => expect(callback).toBeDefined());
    await callback({ credential: 'tok' });
    expect(onError).toHaveBeenLastCalledWith(t.errors.notFound);
    expect(push).not.toHaveBeenCalled();
  });
});

describe('googleMessage', () => {
  it('traduit chaque statut en une phrase claire', () => {
    expect(googleMessage(new GoogleSignInError(409))).toBe(t.errors.conflict);
    expect(googleMessage(new GoogleSignInError(503))).toBe(t.errors.unavailable);
    expect(googleMessage(new GoogleSignInError(401))).toBe(t.errors.rejected);
    expect(googleMessage(new GoogleSignInError(500))).toBe(t.errors.server);
    expect(googleMessage(new Error('réseau'))).toBe(t.errors.server);
  });
});
