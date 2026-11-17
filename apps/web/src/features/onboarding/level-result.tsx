import { Button } from '@newstart/ui';
import { Check, TrendingUp } from 'lucide-react';
import type { LevelResult as Result } from '@newstart/shared';
import fr from '../../shared/i18n/fr.json';

const t = fr.level.result;

function Points({ title, items, icon }: { title: string; items: string[]; icon: 'check' | 'up' }) {
  const Icon = icon === 'check' ? Check : TrendingUp;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      <ul className="divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 py-3 text-[15px]">
            <Icon aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-accent-text" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Écran de résultat du test : niveau estimé, ce qui va bien, ce qu'on travaille. */
export function LevelResult({ result, onStart }: { result: Result; onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col gap-7">
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-text-muted">{t.levelLabel}</p>
        <h1 className="font-display text-[56px] leading-none font-bold tracking-[-0.02em]">
          {result.level}
        </h1>
        <p className="text-[15px] text-text-muted">{result.justification}</p>
      </div>
      <Points title={t.strengths} items={result.strengths} icon="check" />
      <Points title={t.weaknesses} items={result.weaknesses} icon="up" />
      <Button size="lg" onClick={onStart} className="mt-auto">
        {t.start}
      </Button>
    </div>
  );
}
