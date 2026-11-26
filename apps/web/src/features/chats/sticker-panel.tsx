'use client';

import { Sticker } from '@newstart/ui';
import { STICKER_GROUPS, STICKERS } from '@newstart/shared';
import { useState } from 'react';
import fr from '../../shared/i18n/fr.json';

const c = fr.conversation;

/** Les stickers, rangés par groupe, avec une recherche sur la légende anglaise. Un toucher envoie. */
export function StickerPanel({ onPick }: { onPick: (stickerId: string) => void }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const found = STICKERS.filter((s) => s.text.toLowerCase().includes(q));
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-[13px] font-semibold">
        {c.stickerSearch}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-11 rounded-full border border-line bg-bg px-4 text-[15px] font-normal focus-visible:outline-2 focus-visible:outline-accent-text"
        />
      </label>
      <div className="max-h-72 overflow-y-auto pr-1">
        {found.length === 0 && (
          <p className="py-4 text-center text-sm text-text-muted">{c.stickerNone}</p>
        )}
        {STICKER_GROUPS.map((group) => {
          const items = found.filter((s) => s.group === group);
          if (items.length === 0) return null;
          return (
            <section key={group} aria-label={group} className="mb-3">
              <h3 className="mb-1 text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
                {group}
              </h3>
              <ul className="grid grid-cols-3 gap-1">
                {items.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      aria-label={c.stickerSend.replace('{text}', s.text)}
                      onClick={() => onPick(s.id)}
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
        })}
      </div>
    </div>
  );
}
