'use client';

import type { AvatarChoice } from '@newstart/shared';
import { AVATAR_VARIANTS, LIBRARY_IDS, NeutralAvatar, PALETTE_NAMES } from '@newstart/ui';
import { useState } from 'react';
import fr from '../i18n/fr.json';
import { useColorScheme } from './use-color-scheme';

const t = fr.avatar;
const FIRST_PAGE = 20;
const PAGE = 40;
/** « initiales » et « vert » existent dans la bibliothèque mais ne sont pas proposés ici. */
const STYLES = AVATAR_VARIANTS.filter((v) => v !== 'vert');
type Style = (typeof STYLES)[number];

const ring =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text';
const selected = (on: boolean) => (on ? 'outline-[3px] outline-offset-2 outline-text outline' : '');

/** Choix de la silhouette, de la couleur et du style, avec un aperçu en grand. */
export function AvatarPicker({
  value,
  name,
  onSave,
  onClose,
}: {
  value: AvatarChoice | null;
  name: string;
  onSave: (choice: AvatarChoice | null) => Promise<void> | void;
  onClose: () => void;
}) {
  const theme = useColorScheme();
  const [id, setId] = useState(value?.id ?? LIBRARY_IDS[0] ?? 'a001');
  const [palette, setPalette] = useState<string | undefined>(value?.palette);
  const [style, setStyle] = useState<Style>((value?.variant as Style | undefined) ?? 'duo');
  const [shown, setShown] = useState(FIRST_PAGE);
  const preview = { palette, variant: style, theme } as const;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2 py-2">
        <NeutralAvatar avatarId={id} name={name} className="size-28" {...preview} />
        <span className="text-sm text-text-muted">{name}</span>
      </div>

      <section aria-labelledby="av-sil" className="flex flex-col gap-2.5">
        <h2
          id="av-sil"
          className="text-[13px] font-semibold uppercase tracking-wide text-text-muted"
        >
          {t.silhouette}
        </h2>
        <ul className="grid grid-cols-5 gap-2">
          {LIBRARY_IDS.slice(0, shown).map((candidate) => (
            <li key={candidate} className="flex">
              <button
                type="button"
                aria-pressed={id === candidate}
                aria-label={t.silhouetteN.replace('{id}', candidate.slice(1))}
                onClick={() => setId(candidate)}
                className={`aspect-square min-h-11 w-full rounded-2xl ${ring} ${selected(id === candidate)}`}
              >
                <NeutralAvatar
                  avatarId={candidate}
                  name=""
                  className="size-full rounded-2xl"
                  {...preview}
                />
              </button>
            </li>
          ))}
        </ul>
        {shown < LIBRARY_IDS.length && (
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className={`min-h-11 rounded-full border border-line text-[15px] ${ring}`}
          >
            {t.more.replace('{n}', String(LIBRARY_IDS.length - shown))}
          </button>
        )}
      </section>

      <section aria-labelledby="av-col" className="flex flex-col gap-2.5">
        <h2
          id="av-col"
          className="text-[13px] font-semibold uppercase tracking-wide text-text-muted"
        >
          {t.color}
        </h2>
        <ul className="grid grid-cols-8">
          {PALETTE_NAMES.map((p) => (
            <li key={p} className="flex justify-center">
              <button
                type="button"
                aria-pressed={palette === p}
                aria-label={p}
                onClick={() => setPalette(p)}
                className={`grid size-11 place-items-center rounded-full ${ring}`}
              >
                <NeutralAvatar
                  avatarId={id}
                  name=""
                  variant="gris"
                  theme={theme}
                  palette={p}
                  className={`size-[30px] rounded-full ${selected(palette === p)}`}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-text-muted">
          {t.style}
        </legend>
        <ul className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <li key={s}>
              <button
                type="button"
                aria-pressed={style === s}
                onClick={() => setStyle(s)}
                className={`min-h-11 rounded-full border px-4 text-[15px] ${ring} ${
                  style === s
                    ? 'border-accent bg-accent font-semibold text-on-accent'
                    : 'border-line bg-surface-1'
                }`}
              >
                {t.styles[s]}
              </button>
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={async () => {
            await onSave({ id, ...(palette && { palette }), variant: style } as AvatarChoice);
            onClose();
          }}
          className={`min-h-12 rounded-full bg-accent font-semibold text-on-accent ${ring}`}
        >
          {t.save}
        </button>
        <button
          type="button"
          onClick={async () => {
            await onSave(null);
            onClose();
          }}
          className={`min-h-11 rounded-full border border-line ${ring}`}
        >
          {t.remove}
        </button>
      </div>
    </div>
  );
}
