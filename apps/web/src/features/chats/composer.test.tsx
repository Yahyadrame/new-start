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
// La liste d'émojis a ses propres tests ; ici un seul bouton suffit.
vi.mock('./emoji-panel', () => ({
  EmojiPanel: ({ onPick }: { onPick: (emoji: string) => void }) => (
    <button type="button" onClick={() => onPick('👍')}>
      émoji de test
    </button>
  ),
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

  it('montre le message cité et laisse l’abandonner', () => {
    const onCancelReply = vi.fn();
    render(
      <Composer
        onSend={vi.fn()}
        reply={{ name: 'Jade', text: 'See you' }}
        onCancelReply={onCancelReply}
      />,
    );
    expect(screen.getByText(c.replyingTo.replace('{name}', 'Jade'))).toBeTruthy();
    expect(screen.getByText('See you')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: c.replyCancel }));
    expect(onCancelReply).toHaveBeenCalled();
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

  it('sur téléphone, pas d’onglet émojis : le clavier les propose', () => {
    render(<Composer onSend={vi.fn()} onSendSticker={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: c.stickers }));
    expect(screen.queryByRole('tab', { name: c.emojis })).toBeNull();
  });

  it('sur ordinateur, le panneau a un onglet émojis qui complète le message', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    render(<Composer onSend={vi.fn()} onSendSticker={vi.fn()} />);
    fireEvent.change(field(), { target: { value: 'Hi ' } });
    fireEvent.click(screen.getByRole('button', { name: c.emojiStickers }));
    fireEvent.click(screen.getByRole('button', { name: 'émoji de test' }));
    expect(field().value).toBe('Hi 👍');
    fireEvent.mouseDown(screen.getByRole('tab', { name: c.stickers }));
    expect(await screen.findByLabelText(c.stickerSearch)).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it('n’a pas de bouton stickers sans onSendSticker', () => {
    render(<Composer onSend={vi.fn()} />);
    expect(screen.queryByRole('button', { name: c.stickers })).toBeNull();
  });

  it('ouvre le panneau sous la barre à la place du clavier, et le garde ouvert après un envoi', () => {
    const onSendSticker = vi.fn();
    render(<Composer onSend={vi.fn()} onSendSticker={onSendSticker} />);
    field().focus();
    fireEvent.click(screen.getByRole('button', { name: c.stickers }));
    expect(document.activeElement).not.toBe(field());
    fireEvent.click(
      screen.getByRole('button', { name: c.stickerSend.replace('{text}', 'Hello!') }),
    );
    expect(onSendSticker).toHaveBeenCalledWith('hello');
    expect(screen.getByLabelText(c.stickerSearch)).toBeTruthy();
  });

  it('rend le clavier avec la touche clavier et ferme le panneau', () => {
    render(<Composer onSend={vi.fn()} onSendSticker={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: c.stickers }));
    fireEvent.click(screen.getByRole('button', { name: c.keyboard }));
    expect(screen.queryByLabelText(c.stickerSearch)).toBeNull();
    expect(document.activeElement).toBe(field());
    expect(screen.getByRole('button', { name: c.stickers })).toBeTruthy();
  });
});

describe('Composer, fermeture du panneau', () => {
  const desktop = () =>
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  const open = (name: string = c.stickers) => {
    render(
      <>
        <p>Dehors</p>
        <Composer onSend={vi.fn()} onSendSticker={vi.fn()} />
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name }));
  };
  const search = () => screen.queryByLabelText(c.stickerSearch);

  afterEach(() => vi.unstubAllGlobals());

  it('se ferme avec Échap et rend le focus au bouton', () => {
    open();
    fireEvent.keyDown(search() as HTMLElement, { key: 'Escape' });
    expect(search()).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: c.stickers }));
  });

  it('laisse d’abord Échap vider la recherche', () => {
    open();
    fireEvent.change(search() as HTMLElement, { target: { value: 'hel' } });
    fireEvent.keyDown(search() as HTMLElement, { key: 'Escape' });
    expect(search()).toBeTruthy();
  });

  it('ignore un Échap déjà traité (liste d’émojis, fenêtre ouverte)', () => {
    open();
    const handled = (e: Event) => e.preventDefault();
    search()?.addEventListener('keydown', handled);
    fireEvent.keyDown(search() as HTMLElement, { key: 'Escape' });
    expect(search()).toBeTruthy();
  });

  it('se ferme au toucher en dehors, pas au toucher dedans', () => {
    open();
    fireEvent.click(search() as HTMLElement);
    expect(search()).toBeTruthy();
    fireEvent.click(screen.getByText('Dehors'));
    expect(search()).toBeNull();
  });

  it('sur téléphone, toucher le champ rend la place au clavier', () => {
    open();
    fireEvent.focus(field());
    expect(search()).toBeNull();
  });

  it('sur ordinateur, on écrit sans fermer le panneau', () => {
    desktop();
    open(c.emojiStickers);
    fireEvent.focus(field());
    expect(screen.getByRole('tab', { name: c.emojis })).toBeTruthy();
  });

  it('sur ordinateur, le focus entre dans le panneau à l’ouverture', () => {
    desktop();
    open(c.emojiStickers);
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: c.emojis }));
  });
});

describe('Composer, clavier mobile', () => {
  it('se colle au-dessus du clavier grâce à --kb', () => {
    const { container } = render(<Composer onSend={vi.fn()} />);
    expect((container.firstChild as HTMLElement).className).toContain('bottom-[var(--kb,0px)]');
  });
});

describe('Composer, champ de saisie', () => {
  it('n’affiche aucun cadre de focus autour du champ : le curseur suffit', () => {
    render(<Composer onSend={vi.fn()} />);
    const field = screen.getByLabelText(c.composerLabel);
    expect(field.className).toContain('outline-none');
    // L'indicateur de focus clavier passe par le conteneur, en gris neutre.
    expect(field.parentElement?.className).toContain('focus-within:ring-text-muted');
    expect(field.className).not.toContain('focus-visible:outline-2');
  });
});

describe('Composer, modification', () => {
  it('reprend le texte du message, l’envoie au même bouton et se vide à l’annulation', () => {
    const onSend = vi.fn();
    const onCancelEdit = vi.fn();
    const { rerender } = render(
      <Composer onSend={onSend} edit={{ id: 'm1', text: 'I go' }} onCancelEdit={onCancelEdit} />,
    );
    expect(screen.getByText(c.editing)).toBeTruthy();
    expect((screen.getByLabelText(c.composerLabel) as HTMLTextAreaElement).value).toBe('I go');
    expect(screen.queryByRole('button', { name: c.record })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: c.editCancel }));
    expect(onCancelEdit).toHaveBeenCalled();
    rerender(<Composer onSend={onSend} edit={null} />);
    expect((screen.getByLabelText(c.composerLabel) as HTMLTextAreaElement).value).toBe('');
    expect(screen.queryByText(c.editing)).toBeNull();
  });
});
