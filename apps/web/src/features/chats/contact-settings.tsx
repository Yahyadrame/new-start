import { CONTACT_DIFFICULTIES, CONTACT_TONES, type ContactVariant } from '@newstart/shared';
import { cn } from '@newstart/ui';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import fr from '../../shared/i18n/fr.json';

const t = fr.contact.settings;

function Choice<V extends string>({
  legend,
  name,
  options,
  labels,
  value,
  hint,
  onPick,
}: Readonly<{
  legend: string;
  name: string;
  options: readonly V[];
  labels: Record<string, string>;
  value: V | undefined;
  hint: string;
  onPick: (value: V) => void;
}>) {
  return (
    <fieldset className="flex flex-col gap-1.5 py-2">
      <legend className="font-semibold">{legend}</legend>
      <div className="flex gap-1.5">
        {options.map((option) => (
          <label key={option} className="flex-1">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onPick(option)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-line bg-bg text-sm',
                'peer-checked:border-accent peer-checked:bg-accent peer-checked:font-semibold peer-checked:text-on-accent',
                'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-text',
              )}
            >
              {labels[option] ?? option}
            </span>
          </label>
        ))}
      </div>
      <p className="text-[13px] text-text-muted">{hint}</p>
    </fieldset>
  );
}

/** Le ton et la difficulté que la personne choisit pour ce contact, et l'accès à son avatar. */
export function ContactSettings({
  name,
  avatarHref,
  variant,
  saved,
  error,
  onChange,
  onReset,
}: Readonly<{
  name: string;
  avatarHref: string;
  variant: ContactVariant | null;
  saved: boolean;
  error: boolean;
  onChange: (next: ContactVariant) => void;
  onReset: () => void;
}>) {
  const fill = (text: string) => text.replace('{name}', name);
  const tone = variant?.tone;
  const difficulty = variant?.difficulty;
  const hints: Record<string, string> = t.toneHints;
  const levelHints: Record<string, string> = t.difficultyHints;
  return (
    <section
      aria-labelledby="contact-settings"
      className="rounded-2xl border border-line bg-surface-1 px-4 py-1"
    >
      <h3
        id="contact-settings"
        className="pt-3.5 pb-1 text-xs font-semibold tracking-wide text-text-muted uppercase"
      >
        {t.title}
      </h3>
      <Choice
        legend={t.tone}
        name="tone"
        options={CONTACT_TONES}
        labels={t.toneOptions}
        value={tone}
        hint={tone ? fill(hints[tone] ?? '') : fill(t.toneDefault)}
        onPick={(next) => onChange({ ...variant, tone: next })}
      />
      <Choice
        legend={t.difficulty}
        name="difficulty"
        options={CONTACT_DIFFICULTIES}
        labels={{}}
        value={difficulty}
        hint={difficulty ? (levelHints[difficulty] ?? '') : fill(t.difficultyDefault)}
        onPick={(next) => onChange({ ...variant, difficulty: next })}
      />
      <Link
        href={avatarHref}
        className="flex min-h-11 items-center justify-between border-t border-line"
      >
        <span>{t.avatar}</span>
        <span className="flex items-center text-text-muted">
          {t.changeAvatar}
          <ChevronRight aria-hidden="true" className="size-4" />
        </span>
      </Link>
      {variant && (
        <button
          type="button"
          onClick={onReset}
          className="min-h-11 w-full text-text-muted underline"
        >
          {t.reset}
        </button>
      )}
      <div aria-live="polite" className="empty:hidden">
        {saved && <p className="pb-3 text-[13px] text-text-muted">{fill(t.saved)}</p>}
        {error && (
          <p role="alert" className="pb-3 text-[13px] text-danger">
            {t.error}
          </p>
        )}
      </div>
    </section>
  );
}
