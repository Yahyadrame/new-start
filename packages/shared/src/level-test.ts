import { z } from 'zod';

/** Les 5 questions fixes de Jade, de plus en plus difficiles (A1 à C1). */
export const LEVEL_QUESTIONS = [
  { position: 1, text: "Hi, I'm Jade! What's your name, and where are you from?" },
  { position: 2, text: 'What do you usually do on a normal day?' },
  { position: 3, text: 'Tell me about a place you visited, or would like to visit. Why?' },
  { position: 4, text: 'Describe a problem you had recently and how you dealt with it.' },
  {
    position: 5,
    text: 'Some people say technology makes us less social. What do you think?',
  },
] as const;

export const LEVEL_TEST_LENGTH = LEVEL_QUESTIONS.length;

export const LevelAnswerBody = z.object({
  position: z.number().int().min(1).max(LEVEL_TEST_LENGTH),
  text: z.string().trim().min(1).max(1000),
});
export type LevelAnswerBody = z.infer<typeof LevelAnswerBody>;

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

/** Résultat du test : niveau CECR, une phrase de justification, 3 points forts et 3 à travailler (en français). */
export const LevelResult = z.object({
  level: z.enum(CEFR_LEVELS),
  justification: z.string().min(1),
  strengths: z.array(z.string().min(1)).length(3),
  weaknesses: z.array(z.string().min(1)).length(3),
});
export type LevelResult = z.infer<typeof LevelResult>;
