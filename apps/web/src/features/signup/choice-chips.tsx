'use client';

import { Check } from 'lucide-react';
import fr from '../../shared/i18n/fr.json';

export type Choice = { value: string; label: string; hint?: string };

/**
 * Puces à cocher façon réseaux sociaux : plusieurs choix, jusqu'à `max`.
 * Chaque puce est un vrai bouton (`aria-pressed`) d'au moins 44 px ; une fois le maximum atteint,
 * les autres se grisent mais restent lisibles.
 */
export function ChoiceChips({
  legend,
  choices,
  value,
  max,
  onChange,
  layout = 'cards',
}: {
  legend: string;
  choices: Choice[];
  value: string[];
  max: number;
  onChange: (next: string[]) => void;
  layout?: 'cards' | 'pills';
}) {
  const full = value.length >= max;
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">{legend}</legend>
      <ul className={layout === 'cards' ? 'grid grid-cols-2 gap-2.5' : 'flex flex-wrap gap-2.5'}>
        {choices.map(({ value: v, label, hint }) => {
          const on = value.includes(v);
          return (
            <li key={v} className={layout === 'cards' ? 'flex' : undefined}>
              <button
                type="button"
                aria-pressed={on}
                disabled={full && !on}
                onClick={() => toggle(v)}
                className={`flex min-h-11 w-full gap-2 border text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text disabled:opacity-50 ${
                  layout === 'cards'
                    ? 'min-h-24 flex-col rounded-2xl p-4'
                    : 'items-center rounded-full px-4 py-2'
                } ${on ? 'border-accent bg-surface-2' : 'border-line bg-surface-1'}`}
              >
                <span className="flex items-center gap-2 text-[15px] font-semibold">
                  {on && <Check aria-hidden="true" className="size-4 shrink-0 text-accent-text" />}
                  {label}
                </span>
                {hint && <span className="text-[13px] text-text-muted">{hint}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <p role="status" className="text-[13px] text-text-muted">
        {fr.signup.chosen.replace('{n}', String(value.length)).replace('{max}', String(max))}
      </p>
    </fieldset>
  );
}
