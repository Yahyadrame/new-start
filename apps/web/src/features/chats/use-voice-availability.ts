import { useCallback, useEffect, useState, type RefObject } from 'react';
import fr from '../../shared/i18n/fr.json';
import { getVoiceAvailability } from './chats-api';

const REASONS = new Map(Object.entries(fr.conversation.micBlocked));

/**
 * `blocked` : pourquoi le micro est indisponible, ou `null`. Quand l'appel échoue, rien ne change :
 * le micro reste utilisable et l'envoi dira ce qui ne va pas.
 */
// ponytail: relu à l'ouverture et après un vocal ; le relire au retour au premier plan si la limite
// du jour reste affichée après minuit
export function useVoiceAvailability(token: RefObject<string>, ready: boolean) {
  const [blocked, setBlocked] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      const state = await getVoiceAvailability(token.current);
      setBlocked(state.available ? null : (REASONS.get(state.reason) ?? null));
    } catch {
      return;
    }
  }, [token]);
  useEffect(() => {
    if (ready) void refresh();
  }, [ready, refresh]);
  return { blocked, refresh };
}
