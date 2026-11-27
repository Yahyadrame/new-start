import type { MessageItem } from '@newstart/shared';
import { describe, expect, it } from 'vitest';
import { isAwaiting, isFresh, mergeLatest, POLL_LIMIT, POLL_MS, repliesAfter } from './chats-merge';

const m = (id: string, author: MessageItem['author'], createdAt: string): MessageItem => ({
  id,
  author,
  text: id,
  translationFr: null,
  createdAt,
  correction: null,
  replyTo: null,
  edited: false,
  forwarded: false,
  reaction: null,
  sticker: null,
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

describe('isAwaiting', () => {
  const since = '2026-11-20T10:00:00.000Z';
  const at = (s: number) => `2026-11-20T10:00:${String(s).padStart(2, '0')}.000Z`;
  const answered = (id: string, s: number) => ({
    ...m(id, 'USER', at(s)),
    correction: { better: null, whyFr: null },
  });

  it('attend tant qu’un message parti depuis n’a pas sa correction', () => {
    const first = [answered('u1', 0), m('r1', 'AGENT', at(5))];
    expect(isAwaiting([...first, m('u2', 'USER', at(2))], since)).toBe(true);
    expect(isAwaiting([...first, answered('u2', 2)], since)).toBe(false);
  });

  it('compte un message d’échec pour un message sans réponse', () => {
    const failed = m('s', 'SYSTEM', at(5));
    expect(isAwaiting([m('u1', 'USER', at(0)), failed], since)).toBe(false);
    expect(isAwaiting([m('u1', 'USER', at(0)), m('u2', 'USER', at(1)), failed], since)).toBe(true);
  });

  it('ignore les messages plus anciens et les messages supprimés', () => {
    const old = m('u0', 'USER', '2026-11-20T09:59:00.000Z');
    const deleted = { ...m('u1', 'USER', at(1)), deleted: true };
    expect(isAwaiting([old, deleted], since)).toBe(false);
  });
});

describe('repliesAfter', () => {
  it('compte ce que le contact ou le système ont écrit depuis', () => {
    const since = '2026-11-20T10:00:00.000Z';
    const items = [
      m('old', 'AGENT', '2026-11-20T09:59:00.000Z'),
      m('u', 'USER', '2026-11-20T10:00:01.000Z'),
      m('r', 'AGENT', '2026-11-20T10:00:03.000Z'),
      m('s', 'SYSTEM', '2026-11-20T10:00:04.000Z'),
    ];
    expect(repliesAfter(items, since)).toBe(2);
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
