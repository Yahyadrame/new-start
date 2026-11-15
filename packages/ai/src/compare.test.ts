import { describe, expect, it } from 'vitest';
import {
  judgeLlm,
  meanWer,
  summarizeCalls,
  summarizeLlm,
  timed,
  type Sentence,
} from './compare.js';

const wrong: Sentence = { level: 'A2', text: 'I goed home', expected: 'I went home.' };
const right: Sentence = { level: 'A2', text: 'I went home.', expected: null };
const json = (fix: unknown) => JSON.stringify({ reply: 'Nice!', fix });

describe('judgeLlm', () => {
  it('compte une correction identique à l’attendue, casse et ponctuation ignorées', () => {
    const raw = json({ better: 'i went home', why: 'Passé irrégulier.' });
    expect(judgeLlm(raw, wrong)).toEqual({ validJson: true, fixed: true, exact: true });
  });

  it('refuse une correction différente', () => {
    const raw = json({ better: 'I go home.', why: 'Présent.' });
    expect(judgeLlm(raw, wrong)).toEqual({ validJson: true, fixed: true, exact: false });
  });

  it('juste quand rien n’est corrigé sur une phrase juste', () => {
    expect(judgeLlm(json(null), right)).toEqual({ validJson: true, fixed: false, exact: true });
  });

  it('fausse alerte : une correction sur une phrase juste', () => {
    const raw = json({ better: 'I went back home.', why: 'Plus naturel.' });
    expect(judgeLlm(raw, right).exact).toBe(false);
  });

  it('correction manquée sur une phrase fausse', () => {
    expect(judgeLlm(json(null), wrong)).toEqual({ validJson: true, fixed: false, exact: false });
  });

  it('JSON invalide', () => {
    expect(judgeLlm('pas du json', wrong)).toEqual({
      validJson: false,
      fixed: false,
      exact: false,
    });
    expect(judgeLlm('pas du json', right).exact).toBe(true);
  });
});

describe('timed', () => {
  it('mesure la durée d’un appel réussi', async () => {
    const times = [100, 142];
    const r = await timed(
      async () => 'ok',
      () => times.shift() ?? 0,
    );
    expect(r).toEqual({ ms: 42, value: 'ok' });
  });

  it('note l’erreur sans la relancer et la coupe à 200 caractères', async () => {
    const r = await timed(async () => {
      throw new Error('x'.repeat(300));
    });
    expect(r.error).toHaveLength(200);
    expect(r.value).toBeUndefined();
  });

  it('accepte une erreur qui n’est pas une Error', async () => {
    const r = await timed(() => Promise.reject('refusé'));
    expect(r.error).toBe('refusé');
  });
});

describe('summarizeCalls et summarizeLlm', () => {
  it('résume les durées sans compter les erreurs', () => {
    const s = summarizeCalls([
      { ms: 100, error: undefined },
      { ms: 300, error: undefined },
      { ms: 5, error: 'HTTP 429' },
    ]);
    expect(s).toMatchObject({ calls: 3, errors: 1, firstError: 'HTTP 429' });
    expect(s.p50ms).toBeGreaterThanOrEqual(100);
  });

  it('compte JSON valides, corrections exactes, fausses alertes et oublis', () => {
    const j = (validJson: boolean, fixed: boolean, exact: boolean) => ({ validJson, fixed, exact });
    const s = summarizeLlm([
      { ms: 1, error: undefined, expected: 'a', judgement: j(true, true, true) },
      { ms: 1, error: undefined, expected: null, judgement: j(true, true, false) },
      { ms: 1, error: undefined, expected: 'b', judgement: j(false, false, false) },
      { ms: 1, error: 'HTTP 429', expected: 'c', judgement: undefined },
    ]);
    expect(s).toMatchObject({
      calls: 4,
      errors: 1,
      validJson: 2,
      exactCorrections: 1,
      falseAlarms: 1,
      missed: 1,
    });
  });
});

describe('meanWer', () => {
  it('fait la moyenne sur trois décimales, null sans mesure', () => {
    expect(meanWer([0, 0.1, 0.2])).toBe(0.1);
    expect(meanWer([1, 0, 0])).toBe(0.333);
    expect(meanWer([])).toBeNull();
  });
});
