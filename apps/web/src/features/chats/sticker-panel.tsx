'use client';

import { Sticker } from '@newstart/ui';
import { STICKER_GROUPS, STICKERS, type Sticker as StickerItem } from '@newstart/shared';
import { useState } from 'react';
import fr from '../../shared/i18n/fr.json';

const c = fr.conversation;

const RECENT_KEY = 'ns-recent-stickers';
/** Deux rangées sur téléphone. */
const RECENT_MAX = 8;

/** Les stickers envoyés depuis cet appareil, le dernier d'abord ; une valeur abîmée est ignorée. */
function readRecents(): StickerItem[] {
  try {
    const ids: unknown = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(ids) ? ids.flatMap((id) => STICKERS.find((s) => s.id === id) ?? []) : [];
  } catch {
    return [];
  }
}

function remember(id: string) {
  const ids = [id, ...readRecents().flatMap((s) => (s.id === id ? [] : [s.id]))];
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, RECENT_MAX)));
  } catch {
    // Stockage refusé (navigation privée) : le sticker part quand même.
  }
}

/** Les récents puis les groupes, avec une recherche sur la légende anglaise. Un toucher envoie. */
export function StickerPanel({ onPick }: { onPick: (stickerId: string) => void }) {
  const [query, setQuery] = useState('');
  // Lus à l'ouverture seulement : les boutons ne bougent pas sous le doigt.
  const [recents] = useState(readRecents);
  const q = query.trim().toLowerCase();
  const found = STICKERS.filter((s) => s.text.toLowerCase().includes(q));
  const section = (title: string, items: StickerItem[]) => (
    <section key={title} aria-label={title} className="mb-3">
      <h3 className="mb-1 text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
        {title}
      </h3>
      <ul className="grid grid-cols-4 gap-1 sm:grid-cols-6">
        {items.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              aria-label={c.stickerSend.replace('{text}', s.text)}
              onClick={() => {
                remember(s.id);
                onPick(s.id);
              }}
              className="flex min-h-11 w-full flex-col items-center gap-0.5 rounded-xl p-1 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent-text"
            >
              <Sticker parts={s.parts} alt="" className="size-14" />
              <span className="text-center text-[11px] leading-tight font-semibold text-text-muted">
                {s.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
  return (
    <div className="flex h-full flex-col gap-2">
      <label className="block">
        <span className="sr-only">{c.stickerSearch}</span>
        <input
          type="search"
          placeholder={c.stickerSearch}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-11 w-full rounded-full border border-line bg-bg px-4 text-base focus-visible:outline-2 focus-visible:outline-accent-text"
        />
      </label>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        {found.length === 0 && (
          <p className="py-4 text-center text-sm text-text-muted">{c.stickerNone}</p>
        )}
        {!q && recents.length > 0 && section(c.stickerRecent, recents)}
        {STICKER_GROUPS.map((group) => {
          const items = found.filter((s) => s.group === group);
          return items.length > 0 && section(group, items);
        })}
      </div>
    </div>
  );
}
