import { useCallback, useEffect, useState } from 'react';
import { ensureSession } from '../auth/session';
import { disablePush, enablePush, getPushStatus, type PushStatus } from './subscription';

/**
 * L'état du push sur cet appareil et les deux gestes pour le changer.
 * `status` vaut null le temps de la lecture ; `failed` reste vrai jusqu'au prochain essai.
 * À brancher sur un clic : la demande de permission ne doit jamais partir toute seule.
 */
export function usePush() {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    void getPushStatus().then(setStatus);
  }, []);

  const change = useCallback(async (run: (token: string) => Promise<PushStatus | 'failed'>) => {
    setBusy(true);
    setFailed(false);
    const session = await ensureSession();
    const result = session ? await run(session.accessToken) : 'failed';
    if (result === 'failed') setFailed(true);
    else setStatus(result);
    setBusy(false);
  }, []);

  const enable = useCallback(() => change(enablePush), [change]);
  const disable = useCallback(() => change(disablePush), [change]);

  return { status, busy, failed, enable, disable };
}
