import { z } from 'zod';
import type { LlmProvider, LlmRequest } from './types.js';

export const agentReplySchema = z.object({
  reply: z.string().min(1),
  fix: z
    .object({ better: z.string().min(1), why: z.string().min(1) })
    .nullish()
    .transform((v) => v ?? null),
  // Un sticker mal formé est ignoré, la réponse reste bonne ; l'identifiant est vérifié par l'appelant.
  sticker: z.string().nullish().catch(undefined),
});

export type AgentReply = z.infer<typeof agentReplySchema>;

const REMINDER =
  'Your last answer was not valid. Answer with only this JSON: ' +
  '{"reply": "...", "fix": null | {"better": "...", "why": "..."}}';

/** Lit le JSON de l'agent, avec ou sans bloc de code Markdown autour. Renvoie null si invalide. */
export function parseAgentReply(text: string): AgentReply | null {
  const body = text.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '');
  try {
    const parsed = agentReplySchema.safeParse(JSON.parse(body));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Interroge un agent (docs/09-ia-agents.md) : une nouvelle tentative avec un rappel du format
 * si le JSON est invalide, puis le texte brut en `reply` et `fix = null`.
 */
export async function askAgent(
  llm: LlmProvider,
  request: Omit<LlmRequest, 'json'>,
): Promise<AgentReply & { valid: boolean }> {
  const first = await llm.complete({ ...request, json: true });
  const ok = parseAgentReply(first.text);
  if (ok) return { ...ok, valid: true };
  const second = await llm.complete({
    ...request,
    json: true,
    messages: [
      ...request.messages,
      { role: 'assistant', content: first.text },
      { role: 'user', content: REMINDER },
    ],
  });
  const retry = parseAgentReply(second.text);
  if (retry) return { ...retry, valid: true };
  return { reply: second.text.trim() || first.text.trim(), fix: null, valid: false };
}
