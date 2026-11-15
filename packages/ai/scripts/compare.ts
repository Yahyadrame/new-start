/**
 * Comparaison des fournisseurs IA sur 50 phrases (NS-010).
 * Usage : pnpm --filter @newstart/ai compare   (lit .env.ai.local à la racine, jamais affiché)
 * Écrit evals/results.json. Les modèles sont ceux listés ci-dessous, à dater dans l'ADR.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { normalize, pcmToWav, percentile, wordErrorRate } from '../src/metrics.js';

const GEMINI_KEY = process.env.GEMINI_API_KEY ?? '';
const GROQ_KEY = process.env.GROQ_API_KEY ?? '';
if (!GEMINI_KEY || !GROQ_KEY) throw new Error('GEMINI_API_KEY et GROQ_API_KEY sont requises');

const GEMINI = 'https://generativelanguage.googleapis.com/v1beta';
const GROQ = 'https://api.groq.com/openai/v1';
const LLM_GEMINI = 'gemini-3.5-flash-lite';
const LLM_GROQ = 'openai/gpt-oss-20b';
const STT_GROQ = ['whisper-large-v3-turbo', 'whisper-large-v3'];
const STT_GEMINI = LLM_GEMINI;
const TTS_GEMINI = 'gemini-2.5-flash-preview-tts';
const TTS_GROQ = 'canopylabs/orpheus-v1-english';
const TTS_COUNT = Number(process.env.TTS_COUNT ?? 15);

interface Sentence {
  level: string;
  text: string;
  expected: string | null;
}
const sentences: Sentence[] = JSON.parse(
  readFileSync(new URL('../evals/sentences.json', import.meta.url), 'utf8'),
);

const SYSTEM = `You are Sam, a friendly English-speaking friend chatting with a French-speaking learner of English. Reply ONLY with JSON: {"reply": string (1 to 3 short sentences in English), "fix": null or {"better": string, "why": string (French, 15 words max)}}. Set "fix" only if the learner's last message contains a mistake; "better" is the corrected message, changing as little as possible.`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; value?: T; error?: string }> {
  const t = performance.now();
  try {
    const value = await fn();
    return { ms: Math.round(performance.now() - t), value };
  } catch (e) {
    return { ms: Math.round(performance.now() - t), error: (e as Error).message.slice(0, 200) };
  }
}

async function post(
  url: string,
  headers: Record<string, string>,
  body: string | FormData,
  json = true,
) {
  const res = await fetch(url, {
    method: 'POST',
    headers: json ? { 'Content-Type': 'application/json', ...headers } : headers,
    body,
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
  return res;
}

async function llmGemini(text: string): Promise<string> {
  const res = await post(
    `${GEMINI}/models/${LLM_GEMINI}:generateContent`,
    { 'x-goog-api-key': GEMINI_KEY },
    JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 400 },
    }),
  );
  const d = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return d.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function llmGroq(text: string): Promise<string> {
  const res = await post(
    `${GROQ}/chat/completions`,
    { Authorization: `Bearer ${GROQ_KEY}` },
    JSON.stringify({
      model: LLM_GROQ,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 1000,
      reasoning_effort: 'low',
    }),
  );
  const d = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return d.choices?.[0]?.message?.content ?? '';
}

function judge(raw: string, s: Sentence) {
  let parsed: { reply?: unknown; fix?: { better?: unknown } | null } | null = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    /* JSON invalide */
  }
  const reply =
    parsed !== null && typeof parsed.reply === 'string' && 'fix' in parsed ? parsed.reply : null;
  const validJson = reply !== null;
  const better = typeof parsed?.fix?.better === 'string' ? parsed.fix.better : null;
  const fixed = better !== null;
  const exact = s.expected === null ? !fixed : fixed && normalize(better) === normalize(s.expected);
  return { validJson, fixed, exact, better, reply };
}

async function runLlm(name: string, fn: (t: string) => Promise<string>, pauseMs: number) {
  const rows = [];
  for (const s of sentences) {
    const r = await timed(() => fn(s.text));
    rows.push({
      ...s,
      ms: r.ms,
      error: r.error,
      ...(r.value !== undefined ? judge(r.value, s) : {}),
    });
    await sleep(pauseMs);
  }
  const ok = rows.filter((r) => !r.error);
  const lat = ok.map((r) => r.ms);
  return {
    provider: name,
    calls: rows.length,
    errors: rows.length - ok.length,
    validJson: ok.filter((r) => r.validJson).length,
    exactCorrections: ok.filter((r) => r.exact).length,
    falseAlarms: ok.filter((r) => r.expected === null && r.fixed).length,
    missed: ok.filter((r) => r.expected !== null && !r.fixed).length,
    p50ms: percentile(lat, 50),
    p95ms: percentile(lat, 95),
    rows,
  };
}

async function ttsGemini(text: string): Promise<Uint8Array> {
  const res = await post(
    `${GEMINI}/models/${TTS_GEMINI}:generateContent`,
    { 'x-goog-api-key': GEMINI_KEY },
    JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    }),
  );
  const d = (await res.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[];
  };
  const b64 = d.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!b64) throw new Error("pas d'audio");
  return pcmToWav(Buffer.from(b64, 'base64'));
}

async function ttsGroq(text: string): Promise<Uint8Array> {
  const res = await post(
    `${GROQ}/audio/speech`,
    { Authorization: `Bearer ${GROQ_KEY}` },
    JSON.stringify({ model: TTS_GROQ, input: text, voice: 'autumn', response_format: 'wav' }),
  );
  return new Uint8Array(await res.arrayBuffer());
}

async function sttGroq(model: string, wav: Uint8Array): Promise<string> {
  const form = new FormData();
  form.set('model', model);
  form.set('language', 'en');
  form.set('file', new Blob([wav], { type: 'audio/wav' }), 'a.wav');
  const res = await post(
    `${GROQ}/audio/transcriptions`,
    { Authorization: `Bearer ${GROQ_KEY}` },
    form,
    false,
  );
  return ((await res.json()) as { text: string }).text;
}

async function sttGemini(wav: Uint8Array): Promise<string> {
  const res = await post(
    `${GEMINI}/models/${STT_GEMINI}:generateContent`,
    { 'x-goog-api-key': GEMINI_KEY },
    JSON.stringify({
      contents: [
        {
          parts: [
            { text: 'Transcribe this audio exactly. Output only the transcript.' },
            { inlineData: { mimeType: 'audio/wav', data: Buffer.from(wav).toString('base64') } },
          ],
        },
      ],
    }),
  );
  const d = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return d.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function main() {
  console.log('LLM Gemini…');
  const llmG = await runLlm(`gemini/${LLM_GEMINI}`, llmGemini, 1500);
  console.log('LLM Groq…');
  const llmQ = await runLlm(`groq/${LLM_GROQ}`, llmGroq, 2200);

  // TTS : on lit la phrase correcte (ou la phrase telle quelle si elle était juste).
  const texts = sentences.slice(0, TTS_COUNT).map((s) => s.expected ?? s.text);
  interface TtsRow {
    ms: number;
    error: string | undefined;
    wav: Uint8Array | undefined;
  }
  const ttsG: TtsRow[] = [];
  const ttsQ: TtsRow[] = [];
  for (const t of texts) {
    const g = await timed(() => ttsGemini(t));
    ttsG.push({ ms: g.ms, error: g.error, wav: g.value });
    await sleep(7000);
    const q = await timed(() => ttsGroq(t));
    ttsQ.push({ ms: q.ms, error: q.error, wav: q.value });
    await sleep(2500);
    console.log(`TTS ${ttsG.length}/${texts.length}`);
  }
  const tts = { [`gemini/${TTS_GEMINI}`]: ttsG, [`groq/${TTS_GROQ}`]: ttsQ };

  // STT : l'audio de Gemini TTS sert de voix d'essai pour les deux fournisseurs (pas d'accent réel : limite à dire dans l'ADR).
  interface SttRow {
    ms: number;
    error: string | undefined;
    wer: number | undefined;
  }
  const stt: Record<string, SttRow[]> = {};
  const jobs: [string, (w: Uint8Array) => Promise<string>][] = [
    ...STT_GROQ.map(
      (m) =>
        [`groq/${m}`, (w: Uint8Array) => sttGroq(m, w)] as [
          string,
          (w: Uint8Array) => Promise<string>,
        ],
    ),
    [`gemini/${STT_GEMINI}`, sttGemini],
  ];
  for (const [name, fn] of jobs) {
    const rows: SttRow[] = [];
    for (const [i, t] of texts.entries()) {
      const wav = ttsG[i]?.wav;
      if (!wav) continue;
      const r = await timed(() => fn(wav));
      rows.push({
        ms: r.ms,
        error: r.error,
        wer: r.value === undefined ? undefined : wordErrorRate(t, r.value),
      });
      await sleep(3200);
    }
    stt[name] = rows;
    console.log(`STT ${name} fait`);
  }

  const summarize = (xs: { ms: number; error: string | undefined }[]) => {
    const ok = xs.filter((x) => !x.error);
    return {
      calls: xs.length,
      errors: xs.length - ok.length,
      p50ms: percentile(
        ok.map((x) => x.ms),
        50,
      ),
      p95ms: percentile(
        ok.map((x) => x.ms),
        95,
      ),
      firstError: xs.find((x) => x.error)?.error,
    };
  };
  const out = {
    date: new Date().toISOString().slice(0, 10),
    llm: [llmG, llmQ].map((l) => ({ ...l, rows: undefined })),
    llmRows: { gemini: llmG.rows, groq: llmQ.rows },
    tts: Object.fromEntries(Object.entries(tts).map(([k, v]) => [k, summarize(v)])),
    stt: Object.fromEntries(
      Object.entries(stt).map(([k, v]) => {
        const ws = v.flatMap((x) => (x.wer === undefined ? [] : [x.wer]));
        return [
          k,
          {
            ...summarize(v),
            meanWer: ws.length ? +(ws.reduce((a, b) => a + b, 0) / ws.length).toFixed(3) : null,
          },
        ];
      }),
    ),
  };
  writeFileSync(
    new URL('../evals/results.json', import.meta.url),
    JSON.stringify(out, null, 2) + '\n',
  );
  console.log(JSON.stringify({ llm: out.llm, tts: out.tts, stt: out.stt }, null, 2));
}

await main();
