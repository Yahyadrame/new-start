import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { LevelResult } from './level-result';

afterEach(cleanup);
const result = {
  level: 'B1' as const,
  justification: 'Tu te fais comprendre sur des sujets du quotidien.',
  strengths: ['Vocabulaire courant', 'Phrases simples justes', 'Bonne compréhension'],
  weaknesses: ['Temps du passé', 'Prépositions', 'Phrases longues'],
};

describe('LevelResult', () => {
  it('affiche le niveau, la justification et les deux listes de trois points', () => {
    render(<LevelResult result={result} onStart={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('B1');
    expect(screen.getByText(result.justification)).toBeTruthy();
    expect(screen.getByRole('heading', { name: fr.level.result.strengths })).toBeTruthy();
    expect(screen.getByRole('heading', { name: fr.level.result.weaknesses })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
  });
  it('lance la suite au clic sur « Commencer »', () => {
    const onStart = vi.fn();
    render(<LevelResult result={result} onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: fr.level.result.start }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
