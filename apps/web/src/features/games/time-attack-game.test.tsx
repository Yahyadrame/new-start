import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { TimeAttackGame } from './time-attack-game';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const t = fr.games;
const q = (id: number, answer: boolean) => ({
  kind: 'TRUE_FALSE' as const,
  expressionId: id,
  text: `Expr ${id}`,
  meaningFr: 'sens',
  answer,
});
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

describe('TimeAttackGame', () => {
  it('enchaîne les questions sans bouton « suivant » et compte les points', () => {
    render(
      <TimeAttackGame questions={[q(1, true), q(2, true)]} onReplay={vi.fn()} onFinish={vi.fn()} />,
    );
    click(t.trueFalse.true);
    expect(screen.getByText('Expr 2')).toBeTruthy();
    expect(screen.getByText('10 points')).toBeTruthy();
  });

  it('monte le combo après trois bonnes réponses puis le coupe sur une erreur', () => {
    const qs = [q(1, true), q(2, true), q(3, true), q(4, true), q(5, true)];
    render(<TimeAttackGame questions={qs} onReplay={vi.fn()} onFinish={vi.fn()} />);
    for (let i = 0; i < 3; i++) click(t.trueFalse.true);
    expect(screen.getByText('Combo x2')).toBeTruthy();
    click(t.trueFalse.false);
    expect(screen.getByText('Combo x1')).toBeTruthy();
  });

  it('finit au bout de 60 s, garde le record et rend les ratés une seule fois', () => {
    const onFinish = vi.fn();
    render(
      <TimeAttackGame
        questions={[q(1, true), q(2, true)]}
        onReplay={vi.fn()}
        onFinish={onFinish}
      />,
    );
    click(t.trueFalse.false);
    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(screen.getByText(t.end.title)).toBeTruthy();
    expect(screen.getByText('Record : 0 points')).toBeTruthy();
    expect(onFinish).toHaveBeenCalledOnce();
    expect(onFinish).toHaveBeenCalledWith([1]);
  });

  it('finit quand il n’y a plus de questions et enregistre le record', () => {
    const onReplay = vi.fn();
    render(<TimeAttackGame questions={[q(1, true)]} onReplay={onReplay} onFinish={vi.fn()} />);
    click(t.trueFalse.true);
    expect(screen.getByText('Record : 10 points')).toBeTruthy();
    expect(localStorage.getItem('ns-time-attack-record')).toBe('10');
    click(t.end.replay);
    expect(onReplay).toHaveBeenCalledOnce();
  });
});
