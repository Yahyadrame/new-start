'use client';

import { useEffect, useRef } from 'react';
import { useColorScheme } from '../../shared/avatar/use-color-scheme';

/**
 * La liste complète d'émojis (catégories, recherche, récents, teintes de peau), pour l'ordinateur :
 * sur téléphone, le clavier les propose déjà. Un toucher en ajoute un au message.
 * emoji-mart et ses données ne sont chargés qu'à l'ouverture, depuis notre site (pas de CDN).
 * ponytail: sans @emoji-mart/react, qui n'accepte pas React 19 ; le composant web suffit.
 */
export function EmojiPanel({ onPick }: { onPick: (emoji: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const pick = useRef(onPick);
  pick.current = onPick;
  const theme = useColorScheme();

  useEffect(() => {
    let closed = false;
    const node = host.current;
    void Promise.all([
      import('emoji-mart'),
      import('@emoji-mart/data'),
      import('@emoji-mart/data/i18n/fr.json'),
    ]).then(([{ Picker }, data, i18n]) => {
      if (closed || !node) return;
      const picker = new Picker({
        data: data.default,
        i18n: i18n.default,
        theme,
        previewPosition: 'none',
        skinTonePosition: 'search',
        dynamicWidth: true,
        emojiButtonSize: 44,
        emojiSize: 28,
        onEmojiSelect: (emoji: { native: string }) => pick.current(emoji.native),
      }) as unknown as HTMLElement;
      picker.style.width = '100%';
      picker.style.height = '100%';
      node.replaceChildren(picker);
    });
    return () => {
      closed = true;
      node?.replaceChildren();
    };
  }, [theme]);

  return <div ref={host} className="h-full overflow-hidden" />;
}
