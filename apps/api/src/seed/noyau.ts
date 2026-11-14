export type WordRow = {
  id: number;
  text: string;
  translation: string;
  week: number;
  frequency: number;
};
export type ExpressionRow = {
  id: number;
  text: string;
  meaningFr: string;
  situation: string;
  register: string;
  sceneType: string;
  week: number;
  frequency: number;
};

// CSV simple : champs entre guillemets possibles, sans guillemet échappé ni saut de ligne dans un champ.
export function parseCsv(content: string): string[][] {
  const text = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content; // retire le BOM
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  return lines.slice(1).map((line) => {
    const fields: string[] = [];
    let current = '';
    let quoted = false;
    for (const ch of line) {
      if (ch === '"') quoted = !quoted;
      else if (ch === ',' && !quoted) {
        fields.push(current);
        current = '';
      } else current += ch;
    }
    fields.push(current);
    return fields.map((f) => f.trim());
  });
}

const week = (label: string): number => Number(label.replace('Semaine ', ''));

function need(row: string[], size: number, file: string): string[] {
  if (row.length !== size)
    throw new Error(
      `${file} : ${size} colonnes attendues, ${row.length} trouvées (${row[1] ?? '?'})`,
    );
  return row;
}

export function toWords(csv: string): WordRow[] {
  return parseCsv(csv).map((r) => {
    const [id, text, translation, w, freq] = need(r, 5, 'mots.csv') as [
      string,
      string,
      string,
      string,
      string,
    ];
    return { id: Number(id), text, translation, week: week(w), frequency: Number(freq) };
  });
}

export function toExpressions(csv: string): ExpressionRow[] {
  return parseCsv(csv).map((r) => {
    const [id, text, meaningFr, situation, register, sceneType, w, freq] = need(
      r,
      8,
      'expressions.csv',
    ) as [string, string, string, string, string, string, string, string];
    return {
      id: Number(id),
      text,
      meaningFr,
      situation,
      register,
      sceneType,
      week: week(w),
      frequency: Number(freq),
    };
  });
}

// Sous-ensemble du client Prisma dont le seed a besoin (permet de le tester sans base).
export type NoyauDb = {
  $executeRaw(strings: TemplateStringsArray, ...values: unknown[]): PromiseLike<unknown>;
  $transaction<T>(fn: (tx: NoyauDb) => Promise<T>): Promise<T>;
};

// Une requête par table au lieu d'un upsert par ligne : sur Neon, 1 339 allers-retours dépassent
// le délai de 5 s des transactions Prisma. Idempotent : relancer met à jour sans doublon.
export async function seedNoyau(db: NoyauDb, files: { mots: string; expressions: string }) {
  const words = toWords(files.mots);
  const expressions = toExpressions(files.expressions);
  const col = <T, K extends keyof T>(rows: T[], key: K) => rows.map((r) => r[key]);
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO "Word" ("id", "text", "translation", "week", "frequency")
      SELECT * FROM unnest(${col(words, 'id')}::int[], ${col(words, 'text')}::text[],
        ${col(words, 'translation')}::text[], ${col(words, 'week')}::int[], ${col(words, 'frequency')}::float8[])
      ON CONFLICT ("id") DO UPDATE SET "text" = EXCLUDED."text", "translation" = EXCLUDED."translation",
        "week" = EXCLUDED."week", "frequency" = EXCLUDED."frequency"`;
    await tx.$executeRaw`
      INSERT INTO "Expression" ("id", "text", "meaningFr", "situation", "register", "sceneType", "week", "frequency")
      SELECT * FROM unnest(${col(expressions, 'id')}::int[], ${col(expressions, 'text')}::text[],
        ${col(expressions, 'meaningFr')}::text[], ${col(expressions, 'situation')}::text[],
        ${col(expressions, 'register')}::text[], ${col(expressions, 'sceneType')}::text[],
        ${col(expressions, 'week')}::int[], ${col(expressions, 'frequency')}::float8[])
      ON CONFLICT ("id") DO UPDATE SET "text" = EXCLUDED."text", "meaningFr" = EXCLUDED."meaningFr",
        "situation" = EXCLUDED."situation", "register" = EXCLUDED."register", "sceneType" = EXCLUDED."sceneType",
        "week" = EXCLUDED."week", "frequency" = EXCLUDED."frequency"`;
  });
  return { words: words.length, expressions: expressions.length };
}
