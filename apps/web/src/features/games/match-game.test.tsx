import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { MatchGame } from './match-game';

afterEach(cleanup);
const t = fr.games;
const board = {
  kind: 'MATCH' as const,
  pairs: [
    { expressionId: 1, text: 'You know' },
    { expressionId: 2, text: 'I guess' },
    { expressionId: 3, text: 'No way' },
    { expressionId: 4, text: 'Hang on' },
  ],
  meanings: [
    { expressionId: 3, meaningFr: 'impossible' },
    { expressionId: 1, meaningFr: 'tu sais' },
    { expressionId: 4, meaningFr: 'attends' },
    { expressionId: 2, meaningFr: 'je suppose' },
  ],
};
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const solveAll = () => {
  click('You know');
  click('tu sais');
  click('I guess');
  click('je suppose');
  click('No way');
  click('impossible');
  click('Hang on');
  click('attends');
};

describe('MatchGame', () => {
  it('bloque les sens tant qu’aucune expression n’est choisie', () => {
    render(<MatchGame questions={[board]} onReplay={vi.fn()} />);
    expect((screen.getByRole('button', { name: 'tu sais' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('verrouille une paire juste', () => {
    render(<MatchGame questions={[board]} onReplay={vi.fn()} />);
    click('You know');
    click('tu sais');
    expect((screen.getByRole('button', { name: 'You know' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('signale une paire fausse sans la verrouiller', () => {
    render(<MatchGame questions={[board]} onReplay={vi.fn()} />);
    click('You know');
    click('attends');
    expect(screen.getByText(t.match.wrong)).toBeTruthy();
    expect((screen.getByRole('button', { name: 'You know' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it('finit le tableau, compte les erreurs et propose de rejouer', () => {
    const onReplay = vi.fn();
    render(<MatchGame questions={[board]} onReplay={onReplay} />);
    click('You know');
    click('attends');
    solveAll();
    expect(screen.getByText(t.match.done)).toBeTruthy();
    click(t.finish);
    expect(screen.getByText('1 erreurs au total.')).toBeTruthy();
    click(t.end.replay);
    expect(onReplay).toHaveBeenCalledOnce();
  });

  it('passe au tableau suivant', () => {
    render(<MatchGame questions={[board, board]} onReplay={vi.fn()} />);
    solveAll();
    click(t.match.next);
    expect(screen.getByText('Question 2 sur 2')).toBeTruthy();
  });
});
