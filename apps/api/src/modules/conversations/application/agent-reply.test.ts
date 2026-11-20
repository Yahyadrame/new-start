import { DISTRESS_REPLY_FR, ProviderError, type LlmProvider } from '@newstart/ai';
import { describe, expect, it, vi } from 'vitest';
import { AgentReplyService, type AgentReplyStore, type ReplyContext } from './agent-reply.js';

const context: ReplyContext = {
  agent: { name: 'Jade', persona: 'a flatmate', style: 'casual', accent: 'en-US' },
  learner: { firstName: 'Awa', level: 'B1', goal: 'TRAVEL' },
  history: [
    { author: 'AGENT', text: 'Heyyy!' },
    { author: 'USER', text: 'I am agree' },
  ],
};

const json = (reply: string, fix: unknown = null) => ({ text: JSON.stringify({ reply, fix }) });

function setup(complete: LlmProvider['complete'], ctx: ReplyContext | null = context) {
  const store: AgentReplyStore = {
    context: vi.fn().mockResolvedValue(ctx),
    saveReply: vi.fn().mockResolvedValue(undefined),
    saveFailure: vi.fn().mockResolvedValue(undefined),
  };
  const llm: LlmProvider = { name: 'test', complete: vi.fn(complete) };
  const sleep = vi.fn().mockResolvedValue(undefined);
  return { store, llm, sleep, service: new AgentReplyService(store, llm, sleep) };
}

describe('AgentReplyService.reply, détresse', () => {
  it('répond avec le message de soutien, sans appeler l’IA ni corriger', async () => {
    const distress: ReplyContext = {
      ...context,
      history: [{ author: 'USER', text: 'Je veux mourir' }],
    };
    const { store, llm, service } = setup(async () => json('x'), distress);
    await service.reply('c1', 'm1');
    expect(llm.complete).not.toHaveBeenCalled();
    expect(store.saveReply).toHaveBeenCalledWith('c1', 'm1', {
      reply: DISTRESS_REPLY_FR,
      fix: null,
    });
  });
});

describe('AgentReplyService.reply', () => {
  it('répond avec le gabarit agent.v1 et l’historique, puis enregistre la réponse et la correction', async () => {
    const fix = { better: 'I agree', why: 'On ne dit pas « am agree »' };
    const { store, llm, service } = setup(async () => json('Same here!', fix));
    await service.reply('c1', 'm1');
    const request = vi.mocked(llm.complete).mock.calls[0]?.[0];
    expect(request?.system).toContain('You are Jade, a flatmate.');
    expect(request?.messages).toEqual([
      { role: 'assistant', content: 'Heyyy!' },
      { role: 'user', content: 'I am agree' },
    ]);
    expect(store.saveReply).toHaveBeenCalledWith('c1', 'm1', { reply: 'Same here!', fix });
    expect(store.saveFailure).not.toHaveBeenCalled();
  });

  it('enregistre une correction vide quand le message est déjà correct', async () => {
    const { store, service } = setup(async () => json('Nice!'));
    await service.reply('c1', 'm1');
    expect(store.saveReply).toHaveBeenCalledWith('c1', 'm1', { reply: 'Nice!', fix: null });
  });

  it('ne fait rien quand le message a déjà reçu sa réponse', async () => {
    const { store, llm, service } = setup(async () => json('x'), null);
    await service.reply('c1', 'm1');
    expect(llm.complete).not.toHaveBeenCalled();
    expect(store.saveReply).not.toHaveBeenCalled();
  });

  it('retente deux fois avec une attente qui double, puis réussit', async () => {
    const fail = new ProviderError('gemini', 503, 'indisponible');
    const complete = vi
      .fn<LlmProvider['complete']>()
      .mockRejectedValueOnce(fail)
      .mockRejectedValueOnce(fail)
      .mockResolvedValue(json('Hi!'));
    const { store, sleep, service } = setup(complete);
    await service.reply('c1', 'm1');
    expect(sleep.mock.calls).toEqual([[1000], [2000]]);
    expect(store.saveReply).toHaveBeenCalledTimes(1);
  });

  it('ajoute le message système quand le fournisseur échoue après les nouvelles tentatives', async () => {
    const complete = vi
      .fn<LlmProvider['complete']>()
      .mockRejectedValue(new ProviderError('gemini', 503, 'indisponible'));
    const { store, service } = setup(complete);
    await service.reply('c1', 'm1');
    expect(complete).toHaveBeenCalledTimes(3);
    expect(store.saveFailure).toHaveBeenCalledWith('c1');
    expect(store.saveReply).not.toHaveBeenCalled();
  });

  it('ne retente pas une erreur définitive (clé refusée)', async () => {
    const complete = vi
      .fn<LlmProvider['complete']>()
      .mockRejectedValue(new ProviderError('gemini', 401, 'clé refusée'));
    const { store, service } = setup(complete);
    await service.reply('c1', 'm1');
    expect(complete).toHaveBeenCalledTimes(1);
    expect(store.saveFailure).toHaveBeenCalled();
  });
});

describe('AgentReplyService.schedule', () => {
  it('rend la main tout de suite et avale une erreur de stockage', async () => {
    const { store, service } = setup(async () => json('x'));
    vi.mocked(store.context).mockRejectedValue(new Error('base coupée'));
    expect(service.schedule('c1', 'm1')).toBeUndefined();
    await vi.waitFor(() => expect(store.context).toHaveBeenCalled());
  });
});
