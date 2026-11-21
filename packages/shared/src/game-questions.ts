import { z } from 'zod';

/** Ce que le générateur lit dans une expression ; `example` vient du stock relu (NS-301). */
export const GameExpression = z.object({
  id: z.number().int(),
  text: z.string(),
  meaningFr: z.string(),
  week: z.number().int(),
  /** Phrase d'exemple contenant `text`, générée une fois puis relue. */
  example: z.string().optional(),
});
export type GameExpression = z.infer<typeof GameExpression>;

export const TrueFalseQuestion = z.object({
  kind: z.literal('TRUE_FALSE'),
  expressionId: z.number().int(),
  text: z.string(),
  /** Traduction proposée : la bonne ou celle d'une autre expression. */
  meaningFr: z.string(),
  answer: z.boolean(),
});
export type TrueFalseQuestion = z.infer<typeof TrueFalseQuestion>;

export const MissingWordQuestion = z.object({
  kind: z.literal('MISSING_WORD'),
  expressionId: z.number().int(),
  /** La phrase d'exemple, l'expression remplacée par « ___ ». */
  sentence: z.string(),
  /** La bonne réponse et trois leurres, dans un ordre mélangé. */
  choices: z.array(z.string()).length(4),
  answer: z.string(),
});
export type MissingWordQuestion = z.infer<typeof MissingWordQuestion>;

export const MatchQuestion = z.object({
  kind: z.literal('MATCH'),
  /** Quatre paires ; les sens sont mélangés dans `meanings`. */
  pairs: z.array(z.object({ expressionId: z.number().int(), text: z.string() })).length(4),
  meanings: z.array(z.object({ expressionId: z.number().int(), meaningFr: z.string() })).length(4),
});
export type MatchQuestion = z.infer<typeof MatchQuestion>;

export type Rng = () => number;

const shuffle = <T>(items: readonly T[], rng: Rng): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
};

const pick = <T>(items: readonly T[], rng: Rng): T => items[Math.floor(rng() * items.length)] as T;

/** Vrai ou faux : une fois sur deux, on propose le sens d'une autre expression. */
export function buildTrueFalse(
  target: GameExpression,
  pool: readonly GameExpression[],
  rng: Rng,
): TrueFalseQuestion {
  const others = pool.filter((e) => e.id !== target.id && e.meaningFr !== target.meaningFr);
  const truthful = others.length === 0 || rng() < 0.5;
  return {
    kind: 'TRUE_FALSE',
    expressionId: target.id,
    text: target.text,
    meaningFr: truthful ? target.meaningFr : pick(others, rng).meaningFr,
    answer: truthful,
  };
}

/** Mot manquant : rend null sans phrase d'exemple qui contient l'expression, ou sans 3 leurres. */
export function buildMissingWord(
  target: GameExpression,
  pool: readonly GameExpression[],
  rng: Rng,
): MissingWordQuestion | null {
  const { example } = target;
  if (!example) return null;
  const at = example.toLowerCase().indexOf(target.text.toLowerCase());
  if (at < 0) return null;
  // Leurres de la même semaine d'abord, puis du reste du lot si elle est trop petite.
  const decoys = (week: boolean) =>
    pool.filter(
      (e) => e.id !== target.id && e.text !== target.text && (e.week === target.week) === week,
    );
  const texts = [
    ...new Set([...shuffle(decoys(true), rng), ...shuffle(decoys(false), rng)].map((e) => e.text)),
  ];
  if (texts.length < 3) return null;
  return {
    kind: 'MISSING_WORD',
    expressionId: target.id,
    sentence: `${example.slice(0, at)}___${example.slice(at + target.text.length)}`,
    choices: shuffle([target.text, ...texts.slice(0, 3)], rng),
    answer: target.text,
  };
}

/** Associer : 4 expressions de sens différents, rend null s'il n'y en a pas assez. */
export function buildMatch(pool: readonly GameExpression[], rng: Rng): MatchQuestion | null {
  const seen = new Set<string>();
  const four = shuffle(pool, rng)
    .filter((e) => !seen.has(e.meaningFr) && seen.add(e.meaningFr))
    .slice(0, 4);
  if (four.length < 4) return null;
  return {
    kind: 'MATCH',
    pairs: four.map((e) => ({ expressionId: e.id, text: e.text })),
    meanings: shuffle(
      four.map((e) => ({ expressionId: e.id, meaningFr: e.meaningFr })),
      rng,
    ),
  };
}

/** Corps de `POST /games/results` : le nombre de bonnes réponses d'une partie. */
export const GameResult = z.object({ correct: z.number().int().min(0).max(60) });
export type GameResult = z.infer<typeof GameResult>;
