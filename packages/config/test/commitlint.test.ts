import { describe, expect, it } from 'vitest';
import lint from '@commitlint/lint';
import load from '@commitlint/load';
import config from '../commitlint.config.mjs';

const check = async (msg: string) => {
  const { rules, parserPreset } = await load(config);
  const opts = (parserPreset ? { parserOpts: parserPreset.parserOpts } : {}) as Parameters<
    typeof lint
  >[2];
  return lint(msg, rules, opts);
};

describe('commitlint (Conventional Commits)', () => {
  it('accepte un message conforme', async () => {
    expect((await check('feat(chat): ajoute la correction en direct')).valid).toBe(true);
  });
  it('refuse un message sans type', async () => {
    expect((await check('ajoute la correction')).valid).toBe(false);
  });
  it('refuse un type inconnu', async () => {
    expect((await check('wip: brouillon')).valid).toBe(false);
  });
});
