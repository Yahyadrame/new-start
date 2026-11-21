import type { NestExpressApplication } from '@nestjs/platform-express';
import { describe, expect, it, vi } from 'vitest';
import { rateLimit, useRateLimit } from './rate-limit.js';

const res = () => {
  const json = vi.fn();
  return { json, setHeader: vi.fn(), status: vi.fn(() => ({ json })) };
};

describe('rateLimit', () => {
  it('laisse passer jusqu’à la limite puis répond 429 RATE_LIMITED avec Retry-After', () => {
    const mw = rateLimit(2, () => 0);
    const next = vi.fn();
    const r = res();
    mw({ ip: '1.1.1.1', path: '/me' }, r, next);
    mw({ ip: '1.1.1.1', path: '/me' }, r, next);
    expect(next).toHaveBeenCalledTimes(2);
    mw({ ip: '1.1.1.1', path: '/me' }, r, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(r.setHeader).toHaveBeenCalledWith('Retry-After', '60');
    expect(r.status).toHaveBeenCalledWith(429);
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'RATE_LIMITED' }));
  });

  it('compte chaque adresse à part', () => {
    const mw = rateLimit(1, () => 0);
    const next = vi.fn();
    mw({ ip: 'a', path: '/me' }, res(), next);
    mw({ ip: 'b', path: '/me' }, res(), next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('repart de zéro après une minute', () => {
    let t = 0;
    const mw = rateLimit(1, () => t);
    const next = vi.fn();
    mw({ ip: 'a', path: '/me' }, res(), next);
    t = 60_000;
    mw({ ip: 'a', path: '/me' }, res(), next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('ne compte pas les sondes /health', () => {
    const mw = rateLimit(1, () => 0);
    const next = vi.fn();
    for (let i = 0; i < 5; i++) mw({ ip: 'a', path: '/health/live' }, res(), next);
    expect(next).toHaveBeenCalledTimes(5);
  });

  it('range les requêtes sans adresse sous une même clé', () => {
    const mw = rateLimit(1, () => 0);
    const next = vi.fn();
    mw({ path: '/me' }, res(), next);
    mw({ path: '/me' }, res(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('useRateLimit', () => {
  it('règle les proxys et reste éteinte à 0', () => {
    const app = { set: vi.fn(), use: vi.fn() };
    useRateLimit(app as unknown as NestExpressApplication, 0, 1);
    expect(app.set).toHaveBeenCalledWith('trust proxy', 1);
    expect(app.use).not.toHaveBeenCalled();
  });

  it('branche le middleware quand la limite est positive', () => {
    const app = { set: vi.fn(), use: vi.fn() };
    useRateLimit(app as unknown as NestExpressApplication, 300, 1);
    expect(app.use).toHaveBeenCalledOnce();
  });
});
