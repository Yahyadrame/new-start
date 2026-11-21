import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { TrueFalseGame } from './true-false-game';

afterEach(cleanup);
const t = fr.games;
const q = (text: string, meaningFr: string, answer: boolean) => ({
  kind: 'TRUE_FALSE' as const,
  expressionId: 1,
  text,
  meaningFr,
  answer,
});
const questions = [q('You know', 'tu sais', true), q('I know', 'tu sais', false)];

describe('TrueFalseGame', () => {
  it('montre la première question et sa progression', () => {
    render(<TrueFalseGame questions={questions} onReplay={vi.fn()} onFinish={vi.fn()} />);
    expect(screen.getByText('You know')).toBeTruthy();
    expect(screen.getByText('Question 1 sur 2')).toBeTruthy();
  });

  it('corrige une bonne réponse et bloque les boutons', () => {
    render(<TrueFalseGame questions={questions} onReplay={vi.fn()} onFinish={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: t.trueFalse.true }));
    expect(screen.getByText(t.right)).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: t.trueFalse.false }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('corrige une mauvaise réponse', () => {
    render(<TrueFalseGame questions={questions} onReplay={vi.fn()} onFinish={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: t.trueFalse.false }));
    expect(screen.getByText(t.wrong)).toBeTruthy();
  });

  it('compte le score, finit la partie et propose de rejouer', () => {
    const onReplay = vi.fn();
    render(<TrueFalseGame questions={questions} onReplay={onReplay} onFinish={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: t.trueFalse.true }));
    fireEvent.click(screen.getByRole('button', { name: t.next }));
    expect(screen.getByText('I know')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t.trueFalse.true }));
    fireEvent.click(screen.getByRole('button', { name: t.finish }));
    expect(screen.getByText('1 bonnes réponses sur 2.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t.end.replay }));
    expect(onReplay).toHaveBeenCalledOnce();
  });

  it('rend les expressions ratées une seule fois, à la dernière question', () => {
    const onFinish = vi.fn();
    render(<TrueFalseGame questions={questions} onReplay={vi.fn()} onFinish={onFinish} />);
    fireEvent.click(screen.getByRole('button', { name: t.trueFalse.false }));
    fireEvent.click(screen.getByRole('button', { name: t.next }));
    expect(onFinish).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: t.trueFalse.false }));
    fireEvent.click(screen.getByRole('button', { name: t.finish }));
    expect(onFinish).toHaveBeenCalledOnce();
    expect(onFinish).toHaveBeenCalledWith([1]);
  });
});
