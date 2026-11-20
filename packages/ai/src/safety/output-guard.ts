/** Raison pour laquelle une réponse d'agent est refusée (docs/09-ia-agents.md, « Garde-fous techniques »). */
export type BlockReason = 'attachment' | 'guilt' | 'human' | 'sexual';

const RULES: readonly { reason: BlockReason; patterns: RegExp[] }[] = [
  {
    // Pas de « je t'aime » de l'agent.
    reason: 'attachment',
    patterns: [
      /\bi (?:really |truly |just )?(?:love|adore) you\b/,
      /\bi(?:'m| am) (?:so |deeply )?in love with you\b/,
      /\bi miss you (?:so much|a lot|terribly)\b/,
      /\byou(?:'re| are) (?:all i have|my only (?:friend|one)|everything to me)\b/,
    ],
  },
  {
    // Pas de message culpabilisant (« tu m'as abandonné »).
    reason: 'guilt',
    patterns: [
      /\byou (?:abandoned|ignored|neglected|deserted|forgot about) me\b/,
      /\bdon'?t (?:leave|abandon|ignore) me\b/,
      /\bi(?:'m| am) (?:so |really )?(?:sad|hurt|lonely) (?:that|because|when) you\b/,
    ],
  },
  {
    // Un agent ne se présente jamais comme un humain (CLAUDE.md, « Ce que tu ne fais jamais »).
    reason: 'human',
    patterns: [
      /\bi(?:'m| am) (?:a |an )?(?:real|actual) (?:person|human)\b/,
      /\bi(?:'m| am) (?:a )?human(?! resources)\b/,
      /\bi(?:'m| am) not (?:an? )?(?:ai|a\.i\.|bot|robot|machine|language model|computer program)\b/,
    ],
  },
  {
    // Aucun contenu sexuel, même dans le thème « Amour ».
    reason: 'sexual',
    patterns: [
      /\b(?:naked|nude|erotic|orgasm|horny|porn(?:ography)?|undress|sext(?:ing)?)\b/,
      /\bmake love\b/,
      /\bsleep with you\b/,
      /\bkiss you\b/,
    ],
  },
];

const normalize = (text: string) => text.toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, ' ');

/** Rend la raison du refus, ou null quand la réponse peut partir. Le texte n'est jamais conservé. */
export function checkAgentReply(text: string): BlockReason | null {
  const t = normalize(text);
  return RULES.find((r) => r.patterns.some((p) => p.test(t)))?.reason ?? null;
}

/** Levée quand une réponse est refusée ; son message ne cite que la raison, jamais le texte. */
export class BlockedReplyError extends Error {
  constructor(readonly reason: BlockReason) {
    super(`réponse refusée (${reason})`);
    this.name = 'BlockedReplyError';
  }
}
