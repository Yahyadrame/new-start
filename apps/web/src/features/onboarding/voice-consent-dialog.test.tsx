import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { VoiceConsentDialog } from './voice-consent-dialog';

afterEach(cleanup);
const t = fr.level.voice.consent;

describe('VoiceConsentDialog', () => {
  it("explique l'usage et enregistre l'accord", () => {
    const onAccept = vi.fn();
    render(<VoiceConsentDialog open onAccept={onAccept} onDecline={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: t.title })).toBeTruthy();
    expect(screen.getByText(t.body)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t.accept }));
    expect(onAccept).toHaveBeenCalled();
  });

  it('refuser ou fermer laisse l’écrit', () => {
    const onDecline = vi.fn();
    render(<VoiceConsentDialog open onAccept={vi.fn()} onDecline={onDecline} />);
    fireEvent.click(screen.getByRole('button', { name: t.decline }));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onDecline).toHaveBeenCalledTimes(2);
  });

  it('reste fermée tant qu’on ne la demande pas', () => {
    render(<VoiceConsentDialog open={false} onAccept={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
