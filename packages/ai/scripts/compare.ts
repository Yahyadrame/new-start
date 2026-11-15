/**
 * Banc de comparaison des fournisseurs IA (NS-010, ADR 0001), avec les vrais adaptateurs.
 * Usage : pnpm --filter @newstart/ai compare
 * Lit GROQ_API_KEY et GEMINI_API_KEY dans .env.ai.local (jamais affichées) et écrit evals/results.json.
 * COMPARE_LIMIT=3 limite le nombre de phrases et n'écrit pas le fichier (essai rapide).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { GeminiLlm, GeminiTts } from '../src/providers/gemini.js';
import { GroqLlm, GroqStt } from '../src/providers/groq.js';
import {
  judgeLlm,
  meanWer,
  summarizeCalls,
  summarizeLlm,
  timed,
  type LlmRow,
  type Sentence,
} from '../src/compare.js';
import { wordErrorRate } from '../src/metrics.js';
import type { LlmProvider } from '../src/types.js';

const groqKey = process.env.GROQ_API_KEY ?? '';
const geminiKey = process.env.GEMINI_API_KEY ?? '';
if (!groqKey || !geminiKey) throw new Error('GROQ_API_KEY et GEMINI_API_KEY sont requises');

const SYSTEM = `You are Sam, a friendly English-speaking friend chatting with a French-speaking learner of English. Reply ONLY with JSON: {"reply": string (1 to 3 short sentences in English), "fix": null or {"better": string, "why": string (French, 15 words max)}}. Set "fix" only if the learner's last message contains a mistake; "better" is the corrected message, changing as little as possible.`;

const limit = Number(process.env.COMPARE_LIMIT ?? 0);
const all: Sentence[] = JSON.parse(
  readFileSync(new URL('../evals/sentences.json', import.meta.url), 'utf8'),
);
const sentences = limit > 0 ? all.slice(0, limit) : all;
const ttsCount = limit > 0 ? Math.min(limit, 3) : 15;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runLlm(llm: LlmProvider, pauseMs: number) {
  const rows: LlmRow[] = [];
  for (const s of sentences) {
    const r = await timed(() =>
      llm.complete({ system: SYSTEM, messages: [{ role: 'user', content: s.text }], json: true }),
    );
    rows.push({
      ms: r.ms,
      error: r.error,
      expected: s.expected,
      judgement: r.value ? judgeLlm(r.value.text, s) : undefined,
    });
    await sleep(pauseMs);
  }
  console.log(`LLM ${llm.name} fait`);
  return { provider: llm.name, ...summarizeLlm(rows) };
}

async function main() {
  const llm = [
    await runLlm(new GeminiLlm({ apiKey: geminiKey }), 1500),
    await runLlm(new GroqLlm({ apiKey: groqKey }), 2200),
  ];

  // TTS : on lit la phrase correcte (ou la phrase telle quelle si elle était juste).
  const texts = sentences.slice(0, ttsCount).map((s) => s.expected ?? s.text);
  const tts = new GeminiTts({ apiKey: geminiKey });
  const speech: { ms: number; error: string | undefined; audio: Uint8Array | undefined }[] = [];
  for (const text of texts) {
    const r = await timed(() => tts.synthesize({ text }));
    speech.push({ ms: r.ms, error: r.error, audio: r.value?.audio });
    await sleep(7000);
  }
  console.log(`TTS ${tts.name} fait`);

  // STT : l'audio de Gemini TTS sert de voix d'essai (voix de synthèse, sans accent réel : résultat optimiste).
  const stt: Record<string, unknown> = {};
  for (const model of ['whisper-large-v3-turbo', 'whisper-large-v3']) {
    const groq = new GroqStt({ apiKey: groqKey, model });
    const rows: { ms: number; error: string | undefined }[] = [];
    const wers: number[] = [];
    for (const [i, text] of texts.entries()) {
      const audio = speech[i]?.audio;
      if (!audio) continue;
      const r = await timed(() => groq.transcribe({ audio, mimeType: 'audio/wav' }));
      rows.push({ ms: r.ms, error: r.error });
      if (r.value) wers.push(wordErrorRate(text, r.value.text));
      await sleep(3200);
    }
    stt[groq.name] = { ...summarizeCalls(rows), meanWer: meanWer(wers) };
    console.log(`STT ${groq.name} fait`);
  }

  const out = {
    date: new Date().toISOString().slice(0, 10),
    llm,
    tts: { [tts.name]: summarizeCalls(speech) },
    stt,
  };
  if (limit === 0) {
    writeFileSync(
      new URL('../evals/results.json', import.meta.url),
      JSON.stringify(out, null, 2) + '\n',
    );
  }
  console.log(JSON.stringify(out, null, 2));
}

await main();
