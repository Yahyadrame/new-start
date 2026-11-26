import { DISTRESS_REPLY_FR, ProviderError, type LlmProvider } from '@newstart/ai';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
    clearCorrection: vi.fn().mockResolvedValue(undefined),
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

describe('AgentReplyService.reply, message modifié', () => {
  it('transmet correctionOnly à l’enregistrement', async () => {
    const { store, service } = setup(async () => json('Same here!'));
    await service.reply('c1', 'm1', { correctionOnly: true });
    expect(store.saveReply).toHaveBeenCalledWith(
      'c1',
      'm1',
      { reply: 'Same here!', fix: null },
      { correctionOnly: true },
    );
  });

  it('n’enregistre rien en cas de détresse', async () => {
    const distress: ReplyContext = {
      ...context,
      history: [{ author: 'USER', text: 'Je veux mourir' }],
    };
    const { store, service } = setup(async () => json('x'), distress);
    await service.reply('c1', 'm1', { correctionOnly: true });
    expect(store.saveReply).not.toHaveBeenCalled();
  });

  it('n’ajoute pas de message d’échec quand l’IA ne répond pas', async () => {
    const { store, service } = setup(async () => {
      throw new ProviderError('gemini', 503, 'indisponible');
    });
    await service.reply('c1', 'm1', { correctionOnly: true });
    expect(store.saveFailure).not.toHaveBeenCalled();
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
    expect(store.saveReply).toHaveBeenCalledWith('c1', 'm1', { reply: 'Same here!', fix }, {});
    expect(store.saveFailure).not.toHaveBeenCalled();
  });

  it('enregistre une correction vide quand le message est déjà correct', async () => {
    const { store, service } = setup(async () => json('Nice!'));
    await service.reply('c1', 'm1');
    expect(store.saveReply).toHaveBeenCalledWith('c1', 'm1', { reply: 'Nice!', fix: null }, {});
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
    expect(sleep.mock.calls.slice(0, 2)).toEqual([[1000], [2000]]);
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

describe('AgentReplyService.reply, garde de sortie', () => {
  it('redemande une réponse refusée, puis enregistre la suivante', async () => {
    const answers = [json('I love you!'), json('Same here!')];
    const { store, llm, service } = setup(async () => answers.shift() ?? json('x'));
    await service.reply('c1', 'm1');
    expect(llm.complete).toHaveBeenCalledTimes(2);
    expect(store.saveReply).toHaveBeenCalledWith(
      'c1',
      'm1',
      { reply: 'Same here!', fix: null },
      {},
    );
    expect(store.saveFailure).not.toHaveBeenCalled();
  });

  it('n’enregistre jamais une réponse refusée trois fois et ajoute le message d’échec', async () => {
    const { store, llm, service } = setup(async () => json("I'm a real person"));
    await service.reply('c1', 'm1');
    expect(llm.complete).toHaveBeenCalledTimes(3);
    expect(store.saveReply).not.toHaveBeenCalled();
    expect(store.saveFailure).toHaveBeenCalledWith('c1');
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

describe('AgentReplyService.reply, stickers', () => {
  const received: ReplyContext = {
    ...context,
    history: [{ author: 'USER', text: '[sticker] Thanks!' }],
    stickerReceived: true,
  };
  const withSticker = (sticker: string) => async () => ({
    text: JSON.stringify({ reply: 'Anytime!', fix: null, sticker }),
  });

  it('propose la bibliothèque, sans les stickers affectifs, et enregistre le sticker choisi', async () => {
    const { store, llm, service } = setup(withSticker('welcome'), received);
    await service.reply('c1', 'm1');
    const system = vi.mocked(llm.complete).mock.calls[0]?.[0].system ?? '';
    expect(system).toContain('welcome');
    expect(system).not.toMatch(/\bkiss\b|miss-you/);
    expect(vi.mocked(store.saveReply).mock.calls[0]?.[2]).toEqual({
      reply: 'Anytime!',
      fix: null,
      sticker: 'welcome',
    });
  });

  it('écarte un identifiant inconnu ou interdit', async () => {
    for (const sticker of ['https://example.com/a.png', 'kiss']) {
      const { store, service } = setup(withSticker(sticker), received);
      await service.reply('c1', 'm1');
      expect(vi.mocked(store.saveReply).mock.calls[0]?.[2]).toEqual({
        reply: 'Anytime!',
        fix: null,
      });
    }
  });

  it('n’envoie aucun sticker à qui n’en a pas envoyé', async () => {
    const { store, llm, service } = setup(withSticker('welcome'));
    await service.reply('c1', 'm1');
    expect(vi.mocked(llm.complete).mock.calls[0]?.[0].system).not.toContain('"sticker"');
    expect(vi.mocked(store.saveReply).mock.calls[0]?.[2]).toEqual({
      reply: 'Anytime!',
      fix: null,
    });
  });
});

describe('AgentReplyService.reply, rythme humain', () => {
  afterEach(() => vi.useRealTimers());
  const waited = async (reply: string, aiTime = 0, options = {}) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const { sleep, service } = setup(async () => {
      vi.setSystemTime(Date.now() + aiTime);
      return json(reply);
    });
    await service.reply('c1', 'm1', options);
    return sleep.mock.calls.map(([ms]) => ms);
  };

  it('attend selon la longueur de la réponse, entre 4 s et 15 s', async () => {
    expect(await waited('Hey!')).toEqual([4000]);
    expect(await waited('a'.repeat(100))).toEqual([8000]);
    expect(await waited('a'.repeat(500))).toEqual([15000]);
  });

  it('compte le temps de l’IA dans l’attente', async () => {
    expect(await waited('Hey!', 3000)).toEqual([1000]);
    expect(await waited('Hey!', 9000)).toEqual([]);
  });

  it('n’attend ni pour une modification, ni pour la détresse, ni pour un échec', async () => {
    expect(await waited('Hey!', 0, { correctionOnly: true })).toEqual([]);
    const distress = setup(async () => json('x'), {
      ...context,
      history: [{ author: 'USER', text: 'Je veux mourir' }],
    });
    await distress.service.reply('c1', 'm1');
    expect(distress.sleep).not.toHaveBeenCalled();
    const failing = setup(async () => {
      throw new ProviderError('gemini', 401, 'clé refusée');
    });
    await failing.service.reply('c1', 'm1');
    expect(failing.sleep).not.toHaveBeenCalled();
  });
});

describe('AgentReplyService.schedule, messages envoyés coup sur coup', () => {
  /** Un service dont la première attente reste ouverte tant que le test ne la libère pas. */
  function held(distressed?: string) {
    const events: string[] = [];
    const store: AgentReplyStore = {
      context: vi.fn(async (_c: string, id: string) => ({
        ...context,
        history: [{ author: 'USER' as const, text: id === distressed ? 'Je veux mourir' : id }],
      })),
      saveReply: vi.fn(async (_c, id, _r, options) => {
        events.push(`${id}${options?.correctionOnly ? ' correction' : ''}`);
      }),
      saveFailure: vi.fn(),
      clearCorrection: vi.fn(async (id) => {
        events.push(`${id} effacée`);
      }),
    };
    const llm: LlmProvider = { name: 'test', complete: vi.fn(async () => json('Hey!')) };
    let release = () => {};
    const sleep = vi
      .fn<(ms: number) => Promise<void>>()
      .mockImplementationOnce(() => new Promise((resolve) => (release = resolve)))
      .mockResolvedValue(undefined);
    const service = new AgentReplyService(store, llm, sleep);
    const paused = () => vi.waitFor(() => expect(sleep).toHaveBeenCalled());
    return { events, store, llm, service, paused, release: () => release() };
  }

  it('répond à chacun, dans l’ordre, le suivant relisant la réponse précédente', async () => {
    const { events, store, llm, service, paused, release } = held();
    service.schedule('c1', 'm1');
    await paused();
    service.schedule('c1', 'm2');
    await new Promise((r) => setImmediate(r));
    expect(llm.complete).toHaveBeenCalledTimes(1);
    release();
    await vi.waitFor(() => expect(events).toEqual(['m1', 'm2']));
    expect(vi.mocked(store.context).mock.calls.at(-1)).toEqual([
      'c1',
      'm2',
      { withLaterReplies: true },
    ]);
  });

  it('ne fait pas attendre une autre conversation', async () => {
    const { events, service, paused } = held();
    service.schedule('c1', 'm1');
    await paused();
    service.schedule('c2', 'm9');
    await vi.waitFor(() => expect(events).toEqual(['m9']));
  });

  it('répond tout de suite à la détresse et ne garde que la correction des réponses en attente', async () => {
    const { events, service, paused, release } = held('m2');
    service.schedule('c1', 'm1');
    await paused();
    service.schedule('c1', 'm2');
    await vi.waitFor(() => expect(events).toEqual(['m2']));
    release();
    await vi.waitFor(() => expect(events).toEqual(['m2', 'm1 correction']));
  });

  it('garde la réponse d’un message modifié pendant l’attente, puis refait sa correction', async () => {
    const { events, service, paused, release } = held();
    service.schedule('c1', 'm1');
    await paused();
    service.schedule('c1', 'm1', { correctionOnly: true });
    release();
    await vi.waitFor(() => expect(events).toEqual(['m1', 'm1 effacée', 'm1 correction']));
  });

  it('continue la file après une erreur', async () => {
    const { events, store, service } = held();
    vi.mocked(store.context).mockRejectedValueOnce(new Error('base coupée'));
    service.schedule('c1', 'm1', { correctionOnly: true });
    service.schedule('c1', 'm2', { correctionOnly: true });
    await vi.waitFor(() => expect(events).toContain('m2 correction'));
  });
});
