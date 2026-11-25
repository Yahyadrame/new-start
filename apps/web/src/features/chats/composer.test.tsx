import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { Composer, MAX_FILE_BYTES } from './composer';

const recorder = vi.hoisted(() => ({
  recording: false,
  seconds: 0,
  error: null as null | 'denied' | 'unavailable',
  start: vi.fn(),
  stop: vi.fn(),
  cancel: vi.fn(),
  onClip: null as null | ((clip: unknown) => void),
}));
vi.mock('./use-voice-recorder', () => ({
  formatDuration: (n: number) => `0:0${n}`,
  useVoiceRecorder: (onClip: (clip: unknown) => void) => {
    recorder.onClip = onClip;
    return recorder;
  },
}));

beforeEach(() => {
  Object.assign(recorder, { recording: false, seconds: 0, error: null });
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);
const c = fr.conversation;
const field = () => screen.getByLabelText(c.composerLabel) as HTMLTextAreaElement;
const form = () => field().closest('form') as HTMLFormElement;
const choose = (testId: string, file: File) =>
  fireEvent.change(screen.getByTestId(testId), { target: { files: [file] } });

describe('Composer', () => {
  it('montre le micro quand le champ est vide ou ne contient que des espaces, et l’envoi quand il y a du texte', () => {
    render(<Composer onSend={vi.fn()} />);
    expect(screen.getByRole('button', { name: c.record })).toBeTruthy();
    expect(screen.queryByRole('button', { name: c.send })).toBeNull();
    fireEvent.change(field(), { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: c.record })).toBeTruthy();
    fireEvent.change(field(), { target: { value: 'Hi' } });
    expect(screen.getByRole('button', { name: c.send })).toBeTruthy();
    expect(screen.queryByRole('button', { name: c.record })).toBeNull();
  });

  it('envoie le texte sans espaces autour puis vide le champ', () => {
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    fireEvent.change(field(), { target: { value: '  Hello there  ' } });
    fireEvent.submit(form());
    expect(onSend).toHaveBeenCalledWith('Hello there');
    expect(field().value).toBe('');
  });

  it("n'envoie rien quand le champ est vide", () => {
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    fireEvent.submit(form());
    expect(onSend).not.toHaveBeenCalled();
  });

  it('envoie avec Entrée et passe à la ligne avec Maj+Entrée', () => {
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    fireEvent.change(field(), { target: { value: 'Hello' } });
    fireEvent.keyDown(field(), { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(field(), { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('Hello');
    expect(field().value).toBe('');
  });

  // Sous 16 px, Safari sur iPhone zoome la page au toucher du champ : bulles et bouton coupés.
  it('écrit en 16 px pour que le téléphone ne zoome pas au toucher', () => {
    render(<Composer onSend={vi.fn()} />);
    expect(field().className).toContain('text-base');
  });

  it('lance l’enregistrement au toucher du micro', () => {
    render(<Composer onSend={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: c.record }));
    expect(recorder.start).toHaveBeenCalled();
  });

  it('affiche la durée pendant l’enregistrement, avec annulation et fin', () => {
    Object.assign(recorder, { recording: true, seconds: 5 });
    render(<Composer onSend={vi.fn()} />);
    expect(screen.getByRole('timer').textContent).toBe('0:05');
    fireEvent.click(screen.getByRole('button', { name: c.recordingCancel }));
    expect(recorder.cancel).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: c.recordingStop }));
    expect(recorder.stop).toHaveBeenCalled();
  });

  it('explique un micro refusé ou absent', () => {
    recorder.error = 'denied';
    const { rerender } = render(<Composer onSend={vi.fn()} />);
    expect(screen.getByRole('status').textContent).toBe(c.micDenied);
    recorder.error = 'unavailable';
    rerender(<Composer onSend={vi.fn()} />);
    expect(screen.getByRole('status').textContent).toBe(c.micUnavailable);
  });

  it('prévisualise un vocal, le retire, et dit que l’envoi arrive bientôt sans onSendMedia', () => {
    render(<Composer onSend={vi.fn()} />);
    act(() => recorder.onClip?.({ blob: new Blob(['x']), url: 'blob:voice', seconds: 4 }));
    expect(screen.getByLabelText('Message vocal, 0:04')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: c.send }));
    expect(screen.getByRole('status').textContent).toBe(c.mediaSoon);
    fireEvent.click(screen.getByRole('button', { name: c.draftRemove }));
    expect(screen.getByLabelText(c.composerLabel)).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('prévisualise une photo choisie puis l’envoie quand l’envoi est branché', () => {
    const onSendMedia = vi.fn();
    render(<Composer onSend={vi.fn()} onSendMedia={onSendMedia} />);
    const photo = new File(['x'], 'plage.png', { type: 'image/png' });
    choose('photo-input', photo);
    expect(screen.getByText('plage.png')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: c.send }));
    expect(onSendMedia).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'file', file: photo }),
    );
    expect(screen.getByLabelText(c.composerLabel)).toBeTruthy();
  });

  it('prévisualise un document par son nom', () => {
    render(<Composer onSend={vi.fn()} />);
    choose('file-input', new File(['x'], 'cv.pdf', { type: 'application/pdf' }));
    expect(screen.getByText('cv.pdf')).toBeTruthy();
  });

  it('refuse un fichier de plus de 10 Mo', () => {
    render(<Composer onSend={vi.fn()} />);
    const big = new File(['x'], 'gros.pdf');
    Object.defineProperty(big, 'size', { value: MAX_FILE_BYTES + 1 });
    choose('file-input', big);
    expect(screen.getByRole('status').textContent).toBe(c.fileTooBig);
    expect(screen.getByLabelText(c.composerLabel)).toBeTruthy();
  });

  it('propose photo et document depuis le bouton +', async () => {
    render(<Composer onSend={vi.fn()} />);
    fireEvent.pointerDown(screen.getByRole('button', { name: c.attach }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(screen.getByRole('button', { name: c.attach }));
    expect(await screen.findByRole('button', { name: c.attachPhoto })).toBeTruthy();
    expect(screen.getByRole('button', { name: c.attachFile })).toBeTruthy();
  });
});
