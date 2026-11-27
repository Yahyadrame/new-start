import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { useVoiceConsent } from './use-voice-consent';

const api = vi.hoisted(() => ({ getVoiceConsent: vi.fn(), setVoiceConsent: vi.fn() }));
vi.mock('../../shared/voice-consent/voice-consent-api', () => api);

beforeEach(() => {
  vi.resetAllMocks();
  api.setVoiceConsent.mockResolvedValue(undefined);
});
afterEach(cleanup);
const t = fr.conversation.voiceConsent;

let ask: () => Promise<boolean>;
let forget: () => void;
function Host() {
  const consent = useVoiceConsent(() => 'tok', 'Jade');
  ask = consent.ensure;
  forget = consent.forget;
  return <>{consent.dialog}</>;
}
/** Demande l'accord et rend la promesse, une fois les appels en cours passés. */
const begin = async () => {
  let answer!: Promise<boolean>;
  await act(async () => {
    answer = ask();
    answer.catch(() => undefined);
  });
  return answer;
};
const pending = async () => {
  const box: { answer?: Promise<boolean> } = {};
  await act(async () => {
    box.answer = ask();
    box.answer.catch(() => undefined);
  });
  return box as { answer: Promise<boolean> };
};
const press = async (name: string) => {
  await act(async () => void fireEvent.click(screen.getByRole('button', { name })));
};

describe('useVoiceConsent', () => {
  it('laisse enregistrer sans rien demander quand l’accord est déjà donné', async () => {
    api.getVoiceConsent.mockResolvedValue(true);
    render(<Host />);
    expect(await begin()).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(await begin()).toBe(true);
    expect(api.getVoiceConsent).toHaveBeenCalledTimes(1);
  });

  it('revérifie l’accord après l’avoir oublié', async () => {
    api.getVoiceConsent.mockResolvedValue(true);
    render(<Host />);
    await begin();
    forget();
    await begin();
    expect(api.getVoiceConsent).toHaveBeenCalledTimes(2);
  });

  it('explique l’usage avec le nom du contact, puis enregistre l’accord', async () => {
    api.getVoiceConsent.mockResolvedValue(false);
    render(<Host />);
    const { answer } = await pending();
    expect(screen.getByText(t.body.replace('{name}', 'Jade'))).toBeTruthy();
    await press(t.accept);
    expect(await answer).toBe(true);
    expect(api.setVoiceConsent).toHaveBeenCalledWith('tok', true);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('n’enregistre rien quand la personne refuse, et redemande la fois suivante', async () => {
    api.getVoiceConsent.mockResolvedValue(false);
    render(<Host />);
    const { answer } = await pending();
    await press(t.decline);
    expect(await answer).toBe(false);
    expect(api.setVoiceConsent).not.toHaveBeenCalled();
    await pending();
    expect(screen.getByRole('dialog', { name: t.title })).toBeTruthy();
  });

  it('échoue quand l’accord ne se lit pas ou ne s’enregistre pas', async () => {
    api.getVoiceConsent.mockRejectedValueOnce(new Error('lecture'));
    render(<Host />);
    await expect(begin()).rejects.toThrow('lecture');
    api.getVoiceConsent.mockResolvedValue(false);
    api.setVoiceConsent.mockRejectedValue(new Error('écriture'));
    const { answer } = await pending();
    await press(t.accept);
    await expect(answer).rejects.toThrow('écriture');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
