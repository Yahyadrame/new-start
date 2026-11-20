import { describe, expect, it, vi } from 'vitest';
import { NotebookService, type NotebookRow, type NotebookStore } from './notebook.js';

const row: NotebookRow = {
  id: 'n1',
  original: 'I go yesterday',
  better: 'I went yesterday',
  whyFr: 'Passé simple',
  createdAt: new Date('2026-11-20T10:00:00.000Z'),
};
const setup = () => {
  const store: NotebookStore = { list: vi.fn(), add: vi.fn() };
  return { store, service: new NotebookService(store) };
};

describe('NotebookService', () => {
  it('liste les entrées avec la date en texte', async () => {
    const { store, service } = setup();
    vi.mocked(store.list).mockResolvedValue([row]);
    expect(await service.list('u1')).toEqual([{ ...row, createdAt: '2026-11-20T10:00:00.000Z' }]);
  });

  it('garde la correction et rend l’entrée', async () => {
    const { store, service } = setup();
    vi.mocked(store.add).mockResolvedValue(row);
    expect((await service.add('u1', 'm1')).id).toBe('n1');
    expect(store.add).toHaveBeenCalledWith('u1', 'm1');
  });

  it('répond 404 quand il n’y a rien à garder', async () => {
    const { store, service } = setup();
    vi.mocked(store.add).mockResolvedValue(null);
    await expect(service.add('u1', 'm1')).rejects.toMatchObject({ status: 404 });
  });
});
