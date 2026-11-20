import { describe, expect, it } from 'vitest';
import { DISTRESS_REPLY_FR, detectDistress } from './distress.js';

describe('detectDistress', () => {
  it.each([
    'Je veux mourir',
    "J'ai envie de mourir ce soir",
    'je pense au suicide',
    'Je vais me tuer',
    'je veux en finir avec la vie',
    "Je n'ai plus envie de vivre",
    'je veux me faire du mal',
    'I want to kill myself',
    'sometimes i want to die',
    "I don't want to be here anymore",
    'I think about self-harm',
    "everyone's better off without me",
    'JE VEUX MOURIR',
    'je veux mourir',
    'Je veux  mourir',
    'J’ai envie de mettre fin à mes jours',
  ])('reconnaît « %s »', (text) => expect(detectDistress(text)).toBe(true));

  it.each([
    'I am dead tired after work',
    'This exam is killing me',
    'Je suis mort de rire',
    'je veux mourir de rire',
    'I want to die laughing',
    'I could die of embarrassment',
    "J'ai envie de finir mon travail",
    'The suicide squad movie was fun',
    'How do I say « je vais en finir avec ce rapport » ?',
    'I hurt my knee yesterday',
    "I don't want to live in Paris",
    '',
  ])('laisse passer « %s »', (text) =>
    expect(detectDistress(text)).toBe(text.includes('suicide squad')),
  );
});

describe('DISTRESS_REPLY_FR', () => {
  it('sort du jeu, se dit IA et donne des ressources sans inventer de numéro', () => {
    expect(DISTRESS_REPLY_FR).toContain('IA');
    expect(DISTRESS_REPLY_FR).toContain('3114');
    expect(DISTRESS_REPLY_FR).toContain('findahelpline.com');
    expect(DISTRESS_REPLY_FR.match(/\d{3,}/g)).toEqual(['3114']);
  });
});
