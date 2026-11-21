import Link from 'next/link';
import fr from '../../shared/i18n/fr.json';

const t = fr.legal;

type Doc = { title: string; sections: { title: string; body: string[] }[] };

/** Page de texte juridique : titre, mention de version provisoire, puis les sections. */
export function LegalPage({ doc }: Readonly<{ doc: Doc }>) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-6 py-14">
      <Link
        href="/signup"
        className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-accent-text focus-visible:outline-2 focus-visible:outline-accent-text"
      >
        {t.back}
      </Link>
      <h1 className="font-display text-[32px] leading-tight font-bold tracking-[-0.02em]">
        {doc.title}
      </h1>
      <p className="rounded-xl border border-line px-4 py-3 text-sm text-text-muted">{t.draft}</p>
      {doc.sections.map((s) => (
        <section key={s.title} className="flex flex-col gap-2">
          <h2 className="font-display text-xl font-bold">{s.title}</h2>
          {s.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>
      ))}
    </main>
  );
}
