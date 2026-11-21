import type { ProgressSummary } from '@newstart/shared';
import fr from '../../shared/i18n/fr.json';

const t = fr.progress;

const weekday = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', timeZone: 'UTC' });

/** Les 4 chiffres clés et les minutes parlées des 7 derniers jours. */
export function WeekActivity({ summary }: Readonly<{ summary: ProgressSummary }>) {
  const { figures, week } = summary;
  const longest = Math.max(...week.map((d) => d.minutes));
  const cells = [
    [t.figures.messages, figures.messages],
    [t.figures.games, figures.games],
    [t.figures.weekXp, figures.weekXp],
    [t.figures.activeDays, `${figures.activeDays} / 7`],
  ] as const;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="week-title">
      <h2 id="week-title" className="font-display text-xl font-bold">
        {t.figuresTitle}
      </h2>
      <dl className="grid grid-cols-2 gap-3">
        {cells.map(([label, value]) => (
          <div key={label} className="flex flex-col-reverse gap-1 rounded-2xl bg-surface-1 p-4">
            <dt className="text-sm text-text-muted">{label}</dt>
            <dd className="font-display text-3xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-3 rounded-2xl bg-surface-1 p-5">
        <h3 className="text-sm text-text-muted">{t.week.title}</h3>
        {longest === 0 ? (
          <p>{t.week.empty}</p>
        ) : (
          <ol className="flex h-28 items-end gap-2">
            {week.map((d) => (
              <li
                key={d.day}
                aria-label={`${weekday(d.day)} : ${t.week.minutes.replace('{n}', String(d.minutes))}`}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              >
                <div
                  className="w-full rounded-t bg-accent"
                  style={{ height: `${(d.minutes / longest) * 100}%` }}
                />
                <span aria-hidden="true" className="text-xs text-text-muted">
                  {weekday(d.day)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
