import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../i18n/fr.json';
import { VoiceConsentDialog } from './voice-consent-dialog';

afterEach(cleanup);
const t = fr.level.voice.consent;

describe('VoiceConsentDialog', () => {
  it("explique l'usage et enregistre l'accord", () => {
    const onAccept = vi.fn();
    render(<VoiceConsentDialog texts={t} open onAccept={onAccept} onDecline={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: t.title })).toBeTruthy();
    expect(screen.getByText(t.body)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t.accept }));
    expect(onAccept).toHaveBeenCalled();
  });

  it('refuser ou fermer laisse l’écrit', () => {
    const onDecline = vi.fn();
    render(<VoiceConsentDialog texts={t} open onAccept={vi.fn()} onDecline={onDecline} />);
    fireEvent.click(screen.getByRole('button', { name: t.decline }));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onDecline).toHaveBeenCalledTimes(2);
  });

  it('rend le focus au bouton qui l’a ouverte', async () => {
    function Host() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            micro
          </button>
          <VoiceConsentDialog
            texts={t}
            open={open}
            onAccept={vi.fn()}
            onDecline={() => setOpen(false)}
          />
        </>
      );
    }
    render(<Host />);
    const opener = screen.getByRole('button', { name: 'micro' });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole('button', { name: t.decline }));
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it('reste fermée tant qu’on ne la demande pas', () => {
    render(<VoiceConsentDialog texts={t} open={false} onAccept={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
