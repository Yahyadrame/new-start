import { useRef, useState } from 'react';
import fr from '../../shared/i18n/fr.json';
import { getVoiceConsent, setVoiceConsent } from '../../shared/voice-consent/voice-consent-api';
import { VoiceConsentDialog } from '../../shared/voice-consent/voice-consent-dialog';

const t = fr.conversation.voiceConsent;

/**
 * L'accord aux enregistrements vocaux, demandé avant le premier vocal. `ensure` dit si on peut
 * enregistrer ; il ouvre au besoin la fenêtre `dialog`, à placer dans l'écran.
 */
export function useVoiceConsent(token: () => string, name: string) {
  const granted = useRef(false);
  const waiting = useRef<((accepted: boolean) => void) | null>(null);
  const [open, setOpen] = useState(false);

  const answer = (accepted: boolean) => {
    setOpen(false);
    waiting.current?.(accepted);
    waiting.current = null;
  };

  const ensure = async () => {
    if (granted.current || (await getVoiceConsent(token()))) {
      granted.current = true;
      return true;
    }
    setOpen(true);
    if (!(await new Promise<boolean>((resolve) => (waiting.current = resolve)))) return false;
    await setVoiceConsent(token(), true);
    granted.current = true;
    return true;
  };

  const dialog = (
    <VoiceConsentDialog
      texts={{ ...t, body: t.body.replace('{name}', name) }}
      open={open}
      onAccept={() => answer(true)}
      onDecline={() => answer(false)}
    />
  );

  return { ensure, dialog };
}
