import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../test/a11y';
import { VoiceNote, type VoiceNoteProps } from './voice-note';

const wave = vi.hoisted(() => ({ create: vi.fn(), destroy: vi.fn(), setOptions: vi.fn() }));
vi.mock('wavesurfer.js', () => ({ default: { create: wave.create } }));

const play = vi.fn(() => Promise.resolve());
const pause = vi.fn();

beforeEach(() => {
  wave.create.mockReturnValue({ destroy: wave.destroy, setOptions: wave.setOptions });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  document.documentElement.removeAttribute('data-theme');
});

const labels = { play: 'Écouter le vocal', pause: 'Mettre en pause' };
const note = (props: Partial<VoiceNoteProps> = {}) => (
  <VoiceNote
    src="https://files.test/a?sig=1"
    seconds={66}
    peaks={[10, 100]}
    labels={labels}
    unavailableLabel="Vocal indisponible"
    {...props}
  />
);
/** La bibliothèque de l'onde se charge à part : on attend son premier appel. */
const drawn = () =>
  waitFor(() => {
    expect(wave.create).toHaveBeenCalled();
    return wave.create.mock.calls[0]?.[0];
  });
const audioOf = (container: HTMLElement) => {
  const audio = container.querySelector('audio');
  if (!audio) throw new Error('pas de lecteur');
  return audio;
};

describe('VoiceNote', () => {
  it('montre le bouton et la durée sans rien télécharger', () => {
    const { container } = render(note());
    expect(screen.getByRole('button', { name: labels.play })).toBeTruthy();
    expect(screen.getByText('1:06')).toBeTruthy();
    expect(audioOf(container).getAttribute('preload')).toBe('none');
    expect(play).not.toHaveBeenCalled();
  });

  it('fait dessiner l’onde gardée, sans adresse à télécharger', async () => {
    const { container } = render(note());
    const options = await drawn();
    expect(options).toMatchObject({ peaks: [[0.1, 1]], duration: 66, interact: false });
    expect(options.media).toBe(audioOf(container));
    expect(options.url).toBeUndefined();
  });

  it('ne laisse pas les blancs conservés par une bulle déplacer l’onde', async () => {
    render(note());
    const options = await drawn();
    expect((options.container as HTMLElement).className).toContain('whitespace-normal');
  });

  it('dessine des barres égales quand le vocal n’a pas d’onde', async () => {
    render(note({ peaks: undefined, seconds: null }));
    const options = await drawn();
    expect(new Set(options.peaks[0])).toEqual(new Set([0.25]));
    expect(options.duration).toBe(1);
  });

  it('lit, met en pause, puis revient à la durée à la fin', () => {
    const { container } = render(note());
    const audio = audioOf(container);
    fireEvent.click(screen.getByRole('button', { name: labels.play }));
    expect(play).toHaveBeenCalledTimes(1);

    Object.defineProperty(audio, 'paused', { configurable: true, value: false });
    fireEvent.play(audio);
    audio.currentTime = 5.4;
    fireEvent.timeUpdate(audio);
    expect(screen.getByText('0:05')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: labels.pause }));
    expect(pause).toHaveBeenCalledTimes(1);

    fireEvent.ended(audio);
    expect(screen.getByRole('button', { name: labels.play })).toBeTruthy();
    expect(screen.getByText('1:06')).toBeTruthy();
  });

  it('arrête le vocal en cours quand un autre démarre', () => {
    const { container } = render(
      <>
        {note()}
        {note()}
      </>,
    );
    const [first, second] = container.querySelectorAll('audio');
    if (!first || !second) throw new Error('il faut deux lecteurs');
    fireEvent.play(first);
    expect(pause).not.toHaveBeenCalled();
    fireEvent.play(second);
    expect(pause.mock.contexts).toEqual([first]);
  });

  it('reprend avec le lien le plus récent quand le premier ne répond plus', () => {
    const { container, rerender } = render(note());
    rerender(note({ src: 'https://files.test/a?sig=2' }));
    const audio = audioOf(container);
    // La lecture en cours n'est pas coupée par un nouveau lien.
    expect(audio.getAttribute('src')).toBe('https://files.test/a?sig=1');
    fireEvent.error(audio);
    expect(audio.getAttribute('src')).toBe('https://files.test/a?sig=2');
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('le dit quand le fichier ne se lit pas, puis réessaie avec un nouveau lien', async () => {
    const { container, rerender } = render(note());
    await drawn();
    fireEvent.error(audioOf(container));
    expect(screen.getByText('Vocal indisponible')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(wave.destroy).toHaveBeenCalledTimes(1);

    rerender(note({ src: 'https://files.test/a?sig=2' }));
    expect(audioOf(container).getAttribute('src')).toBe('https://files.test/a?sig=2');
  });

  it('affiche la raison donnée quand il n’y a pas de fichier', () => {
    render(note({ src: null, unavailableLabel: 'Vocal expiré' }));
    expect(screen.getByText('Vocal expiré')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(wave.create).not.toHaveBeenCalled();
  });

  it('ne dessine rien si le vocal disparaît avant le chargement de la bibliothèque', async () => {
    render(note()).unmount();
    await vi.dynamicImportSettled();
    expect(wave.create).not.toHaveBeenCalled();
  });

  it('reprend les couleurs quand le thème change', async () => {
    render(note());
    await drawn();
    act(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await waitFor(() => expect(wave.setOptions).toHaveBeenCalled());
  });

  it('n’a pas de violation d’accessibilité', async () => {
    const { container } = render(note());
    await expectNoA11yViolations(container);
  });

  // En dernier : ce test remplace la bibliothèque de l'onde.
  it('lit quand même le vocal si la bibliothèque de l’onde ne se charge pas', async () => {
    vi.resetModules();
    vi.doMock('wavesurfer.js', () => {
      throw new Error('réseau coupé');
    });
    render(note());
    await vi.dynamicImportSettled();
    fireEvent.click(screen.getByRole('button', { name: labels.play }));
    expect(play).toHaveBeenCalledTimes(1);
    expect(wave.create).not.toHaveBeenCalled();
  });
});
