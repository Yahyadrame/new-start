import { ThemeSwitcher } from '../features/theme';
import fr from '../shared/i18n/fr.json';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-5 py-8">
      <div className="flex flex-col gap-6">
        <img
          src="/logo-full-light.svg"
          alt={fr.home.logoAlt}
          width={280}
          height={80}
          className="logo-light"
        />
        <img
          src="/logo-full-dark.svg"
          alt={fr.home.logoAlt}
          width={280}
          height={80}
          className="logo-dark"
        />
        <h1 className="font-display text-[30px] font-bold tracking-[-0.02em]">{fr.home.title}</h1>
      </div>
      <ThemeSwitcher />
    </main>
  );
}
