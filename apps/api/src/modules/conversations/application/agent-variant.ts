import type { ContactVariant } from '@newstart/shared';
import type { ReplyContext } from './agent-reply.js';

/** Style donné à l'agent selon le ton choisi par la personne (texte du prompt, en anglais). */
export const TONE_STYLES: Record<NonNullable<ContactVariant['tone']>, string> = {
  familier: 'casual, warm, short sentences, a bit of slang',
  neutre: 'friendly and clear, plain everyday English, no slang',
  soigne: 'polite and well-spoken, complete sentences, no slang',
};

/** Applique les réglages de la personne : le ton remplace le style du contact, la difficulté son niveau. */
export function applyVariant(
  context: ReplyContext,
  variant: Partial<ContactVariant> | null,
): ReplyContext {
  if (!variant) return context;
  const { tone, difficulty } = variant;
  return {
    ...context,
    agent: tone ? { ...context.agent, style: TONE_STYLES[tone] } : context.agent,
    learner: difficulty ? { ...context.learner, level: difficulty } : context.learner,
  };
}
