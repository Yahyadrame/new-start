import { describe, expect, it } from 'vitest';
import { AddNotebookEntry, NotebookEntryItem } from './notebook.js';

describe('AddNotebookEntry', () => {
  it('accepte un identifiant de message', () => {
    expect(
      AddNotebookEntry.safeParse({ messageId: '0198f0a0-0000-7000-8000-000000000001' }).success,
    ).toBe(true);
  });

  it('refuse un identifiant mal formé ou absent', () => {
    expect(AddNotebookEntry.safeParse({ messageId: 'nope' }).success).toBe(false);
    expect(AddNotebookEntry.safeParse({}).success).toBe(false);
  });
});

describe('NotebookEntryItem', () => {
  it('accepte une explication absente', () => {
    const item = { id: 'n1', original: 'I go', better: 'I went', whyFr: null, createdAt: 'x' };
    expect(NotebookEntryItem.safeParse(item).success).toBe(true);
  });
});
