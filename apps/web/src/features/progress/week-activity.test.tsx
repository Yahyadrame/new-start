import { type DayActivity, summarize } from '@newstart/shared';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { WeekActivity } from './week-activity';

const t = fr.progress;
afterEach(cleanup);

const row = (day: string, over: Partial<DayActivity>): DayActivity => ({
  day,
  spokenSeconds: 0,
  messagesSent: 0,
  gamesPlayed: 0,
  xpEarned: 0,
  ...over,
});

describe('WeekActivity', () => {
  it('affiche les 4 chiffres clés', () => {
    const activity = [row('2026-11-21', { messagesSent: 7, gamesPlayed: 2, xpEarned: 80 })];
    render(<WeekActivity summary={summarize(80, 1, activity, '2026-11-21')} />);
    expect(screen.getByText('7').previousSibling?.textContent).toBe(t.figures.messages);
    expect(screen.getByText('2').previousSibling?.textContent).toBe(t.figures.games);
    expect(screen.getByText('80').previousSibling?.textContent).toBe(t.figures.weekXp);
    expect(screen.getByText('1 / 7').previousSibling?.textContent).toBe(t.figures.activeDays);
  });

  it('dit qu’il n’y a pas encore de minutes parlées plutôt que dessiner des barres vides', () => {
    render(<WeekActivity summary={summarize(0, 0, [], '2026-11-21')} />);
    expect(screen.getByText(t.week.empty)).toBeTruthy();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('dessine une barre par jour, la plus longue à pleine hauteur', () => {
    const activity = [
      row('2026-11-21', { spokenSeconds: 600 }),
      row('2026-11-20', { spokenSeconds: 300 }),
    ];
    render(<WeekActivity summary={summarize(0, 0, activity, '2026-11-21')} />);
    const days = screen.getAllByRole('listitem');
    expect(days).toHaveLength(7);
    expect(days[6]?.getAttribute('aria-label')).toBe('sam. : 10 min');
    expect((days[6]?.firstElementChild as HTMLElement).style.height).toBe('100%');
    expect((days[5]?.firstElementChild as HTMLElement).style.height).toBe('50%');
  });
});
