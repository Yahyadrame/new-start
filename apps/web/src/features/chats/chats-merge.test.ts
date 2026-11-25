import type { MessageItem } from '@newstart/shared';
import { describe, expect, it } from 'vitest';
import { hasReplyAfter, isFresh, mergeLatest, POLL_LIMIT, POLL_MS } from './chats-merge';

const m = (id: string, author: MessageItem['author'], createdAt: string): MessageItem => ({
  id,
  author,
  text: id,
  translationFr: null,
  createdAt,
  correction: null,
  deleted: false,
});

describe('mergeLatest', () => {
  it('ajoute les nouveaux messages dans l’ordre du temps', () => {
    const shown = [m('a', 'USER', '2026-11-20T10:00:00.000Z')];
    const fetched = [m('b', 'AGENT', '2026-11-20T10:00:05.000Z'), shown[0] as MessageItem];
    expect(mergeLatest(shown, fetched).map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('met à jour un message déjà affiché, sans le doubler (la correction arrive après)', () => {
    const shown = [m('a', 'USER', '2026-11-20T10:00:00.000Z')];
    const fixed = { ...shown[0], correction: { better: 'Hi', whyFr: 'Plus naturel' } };
    const merged = mergeLatest(shown, [fixed as MessageItem]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.correction?.better).toBe('Hi');
  });

  it('départage deux messages de même date par leur identifiant', () => {
    const at = '2026-11-20T10:00:00.000Z';
    expect(mergeLatest([m('b', 'USER', at)], [m('a', 'AGENT', at)]).map((x) => x.id)).toEqual([
      'a',
      'b',
    ]);
  });
});

describe('hasReplyAfter', () => {
  const since = '2026-11-20T10:00:00.000Z';
  it('reconnaît une réponse du contact ou du système après le message', () => {
    expect(hasReplyAfter([m('r', 'AGENT', '2026-11-20T10:00:03.000Z')], since)).toBe(true);
    expect(hasReplyAfter([m('s', 'SYSTEM', '2026-11-20T10:00:03.000Z')], since)).toBe(true);
  });
  it('ignore les messages de la personne et les réponses plus anciennes', () => {
    expect(hasReplyAfter([m('u', 'USER', '2026-11-20T10:00:03.000Z')], since)).toBe(false);
    expect(hasReplyAfter([m('r', 'AGENT', '2026-11-20T09:59:00.000Z')], since)).toBe(false);
  });
});

describe('isFresh', () => {
  const now = Date.parse('2026-11-20T10:10:00.000Z');
  it('attend une réponse pendant 60 s au plus', () => {
    expect(POLL_MS * POLL_LIMIT).toBe(60_000);
    expect(isFresh('2026-11-20T10:09:30.000Z', now)).toBe(true);
    expect(isFresh('2026-11-20T10:08:00.000Z', now)).toBe(false);
  });
});
