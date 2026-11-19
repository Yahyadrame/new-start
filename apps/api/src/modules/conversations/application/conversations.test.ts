import { describe, expect, it, vi } from 'vitest';
import { ConversationsService, type ConversationsStore } from './conversations.js';

describe('ConversationsService', () => {
  it('rend les conversations du compte, telles que le stockage les ordonne', async () => {
    const items = [{ id: 'c1' }, { id: 'c2' }] as never;
    const store: ConversationsStore = { list: vi.fn().mockResolvedValue(items) };
    expect(await new ConversationsService(store).list('u1')).toBe(items);
    expect(store.list).toHaveBeenCalledWith('u1');
  });
});
