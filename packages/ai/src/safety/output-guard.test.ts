import { describe, expect, it } from 'vitest';
import { BlockedReplyError, checkAgentReply } from './output-guard.js';

describe('checkAgentReply', () => {
  it.each([
    ['I love you, Awa!', 'attachment'],
    ["I'm so in love with you", 'attachment'],
    ['I miss you so much when you are away', 'attachment'],
    ["You're all I have", 'attachment'],
    ['You abandoned me yesterday.', 'guilt'],
    ["Please don't leave me", 'guilt'],
    ["I'm so sad that you didn't write", 'guilt'],
    ["I'm a real person, trust me", 'human'],
    ['I am human, like you', 'human'],
    ["I'm not an AI", 'human'],
    ['I’m not a robot!', 'human'],
    ['Send me a nude photo', 'sexual'],
    ["Let's make love", 'sexual'],
    ['I want to kiss you', 'sexual'],
    ['I LOVE   YOU', 'attachment'],
  ])('refuse « %s » (%s)', (text, reason) => expect(checkAgentReply(text)).toBe(reason));

  it.each([
    'I love this song! What kind of music do you like?',
    'I love your accent.',
    'Nice! Did you go to the market yesterday?',
    "I'm an AI, but I'd love to hear about your weekend.",
    'I work in human resources.',
    "I'm a human resources manager, actually.",
    'Do you miss your family when you travel?',
    'The doctor asked about sexual health, a common topic.',
    'You forgot the article: "an apple".',
    "Don't leave the sentence unfinished!",
    '',
  ])('laisse passer « %s »', (text) => expect(checkAgentReply(text)).toBeNull());
});

describe('BlockedReplyError', () => {
  it('ne cite que la raison', () => {
    const error = new BlockedReplyError('guilt');
    expect(error.reason).toBe('guilt');
    expect(error.message).toBe('réponse refusée (guilt)');
    expect(error).toBeInstanceOf(Error);
  });
});
