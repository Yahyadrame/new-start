import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setSession } from '../../shared/auth/session';
import fr from '../../shared/i18n/fr.json';

const t = fr.level;
const mocks = vi.hoisted(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  recording: false,
  canRecord: true,
  getVoiceConsent: vi.fn(),
  setVoiceConsent: vi.fn(),
  transcribeAnswer: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('./use-recorder', () => ({
  canRecord: () => mocks.canRecord,
  useRecorder: () => ({ recording: mocks.recording, start: mocks.start, stop: mocks.stop }),
}));
vi.mock('./voice-api', () => ({
  getVoiceConsent: mocks.getVoiceConsent,
  setVoiceConsent: mocks.setVoiceConsent,
  transcribeAnswer: mocks.transcribeAnswer,
}));
const { LevelTest } = await import('./level-test');

beforeEach(() => {
  vi.clearAllMocks();
  mocks.recording = false;
  mocks.canRecord = true;
  mocks.start.mockResolvedValue(true);
  mocks.getVoiceConsent.mockResolvedValue(true);
  setSession({
    accessToken: 'tok',
    expiresInSeconds: 900,
    user: { id: 'u1', firstName: 'Awa', goal: 'WORK', level: 'A1' },
  });
});
afterEach(cleanup);

const mic = () => screen.getByRole('button', { name: /Répondre à voix haute|Arrêter/ });
const draft = () => (screen.getByLabelText(t.answerLabel) as HTMLTextAreaElement).value;
const alert = () => screen.getByRole('alert').textContent;

describe('LevelTest, réponse à la voix', () => {
  it('cache le micro quand le navigateur ne sait pas enregistrer', () => {
    mocks.canRecord = false;
    render(<LevelTest />);
    expect(screen.queryByRole('button', { name: t.voice.start })).toBeNull();
  });

  it('démarre directement quand le consentement est déjà donné', async () => {
    render(<LevelTest />);
    fireEvent.click(mic());
    await waitFor(() => expect(mocks.start).toHaveBeenCalled());
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('demande le consentement, l’enregistre puis démarre', async () => {
    mocks.getVoiceConsent.mockResolvedValue(false);
    render(<LevelTest />);
    fireEvent.click(mic());
    fireEvent.click(await screen.findByRole('button', { name: t.voice.consent.accept }));
    await waitFor(() => expect(mocks.start).toHaveBeenCalled());
    expect(mocks.setVoiceConsent).toHaveBeenCalledWith('tok', true);
  });

  it('« Écrire plutôt » ferme la feuille sans rien enregistrer', async () => {
    mocks.getVoiceConsent.mockResolvedValue(false);
    render(<LevelTest />);
    fireEvent.click(mic());
    fireEvent.click(await screen.findByRole('button', { name: t.voice.consent.decline }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(mocks.setVoiceConsent).not.toHaveBeenCalled();
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it('signale un micro refusé', async () => {
    mocks.start.mockResolvedValue(false);
    render(<LevelTest />);
    fireEvent.click(mic());
    await waitFor(() => expect(alert()).toBe(t.voice.errors.denied));
  });

  it('signale une erreur quand le consentement ne peut pas être lu ou enregistré', async () => {
    mocks.getVoiceConsent.mockRejectedValueOnce(new Error('x'));
    render(<LevelTest />);
    fireEvent.click(mic());
    await waitFor(() => expect(alert()).toBe(t.voice.errors.transcribe));
    mocks.getVoiceConsent.mockResolvedValue(false);
    mocks.setVoiceConsent.mockRejectedValue(new Error('x'));
    fireEvent.click(mic());
    fireEvent.click(await screen.findByRole('button', { name: t.voice.consent.accept }));
    await waitFor(() => expect(mocks.start).not.toHaveBeenCalled());
    expect(alert()).toBe(t.voice.errors.transcribe);
  });

  it('transcrit à l’arrêt et met le texte dans la réponse à relire', async () => {
    mocks.recording = true;
    mocks.stop.mockResolvedValue(new Blob(['x']));
    mocks.transcribeAnswer.mockResolvedValue(' I like tea ');
    render(<LevelTest />);
    await act(async () => fireEvent.click(mic()));
    await waitFor(() => expect(draft()).toBe('I like tea'));
    expect(mocks.transcribeAnswer).toHaveBeenCalledWith('tok', expect.any(Blob));
  });

  it('ajoute le texte dicté à ce qui est déjà écrit', async () => {
    mocks.recording = true;
    mocks.stop.mockResolvedValue(new Blob(['x']));
    mocks.transcribeAnswer.mockResolvedValue('and coffee');
    render(<LevelTest />);
    fireEvent.change(screen.getByLabelText(t.answerLabel), { target: { value: 'I like tea' } });
    await act(async () => fireEvent.click(mic()));
    await waitFor(() => expect(draft()).toBe('I like tea and coffee'));
  });

  it('signale une transcription en échec ou vide', async () => {
    mocks.recording = true;
    mocks.stop.mockResolvedValue(new Blob(['x']));
    mocks.transcribeAnswer.mockRejectedValueOnce(new Error('503'));
    render(<LevelTest />);
    await act(async () => fireEvent.click(mic()));
    await waitFor(() => expect(alert()).toBe(t.voice.errors.transcribe));
    mocks.transcribeAnswer.mockResolvedValueOnce('  ');
    await act(async () => fireEvent.click(mic()));
    await waitFor(() => expect(alert()).toBe(t.voice.errors.empty));
    mocks.stop.mockResolvedValueOnce(null);
    await act(async () => fireEvent.click(mic()));
    await waitFor(() => expect(alert()).toBe(t.voice.errors.empty));
  });

  it('annonce l’écoute en cours', () => {
    mocks.recording = true;
    render(<LevelTest />);
    expect(screen.getByRole('status').textContent).toBe(t.voice.recording);
    expect(mic().getAttribute('aria-pressed')).toBe('true');
  });
});
