import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../../config/env.js';

const client = { status: 'wait', connect: vi.fn(), ping: vi.fn(), disconnect: vi.fn() };
vi.mock('ioredis', () => ({
  Redis: vi.fn(function () {
    return client;
  }),
}));
const { RedisCheck } = await import('./redis.check.js');

const env = (REDIS_URL?: string) => ({ REDIS_URL }) as Env;

beforeEach(() => {
  client.status = 'wait';
  client.connect.mockReset().mockResolvedValue(undefined);
  client.ping.mockReset().mockResolvedValue('PONG');
  client.disconnect.mockReset();
});

describe('RedisCheck', () => {
  it('est désactivé sans REDIS_URL et ne se connecte jamais', async () => {
    const redis = new RedisCheck(env());
    expect(redis.enabled).toBe(false);
    await expect(redis.check()).rejects.toThrow('Redis non configuré');
    expect(client.connect).not.toHaveBeenCalled();
  });
  it('se connecte une fois puis envoie PING', async () => {
    const redis = new RedisCheck(env('redis://localhost:6379'));
    expect(redis.enabled).toBe(true);
    await redis.check();
    expect(client.connect).toHaveBeenCalledOnce();
    expect(client.ping).toHaveBeenCalledOnce();
  });
  it('ne se reconnecte pas quand la connexion existe déjà', async () => {
    client.status = 'ready';
    await new RedisCheck(env('redis://localhost:6379')).check();
    expect(client.connect).not.toHaveBeenCalled();
  });
  it('ferme la connexion à l’arrêt', () => {
    new RedisCheck(env('redis://localhost:6379')).onModuleDestroy();
    expect(client.disconnect).toHaveBeenCalledOnce();
    new RedisCheck(env()).onModuleDestroy();
    expect(client.disconnect).toHaveBeenCalledOnce();
  });
});
