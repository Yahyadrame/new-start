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
  word: { upsert(args: { where: { id: number }; create: WordRow; update: WordRow }): unknown };
  expression: {
    upsert(args: { where: { id: number }; create: ExpressionRow; update: ExpressionRow }): unknown;
  };
  $transaction(ops: unknown[]): Promise<unknown>;
};

// Idempotent : relancer le seed met à jour les lignes existantes au lieu d'échouer.
export async function seedNoyau(db: NoyauDb, files: { mots: string; expressions: string }) {
  const words = toWords(files.mots);
  const expressions = toExpressions(files.expressions);
  await db.$transaction([
    ...words.map((w) => db.word.upsert({ where: { id: w.id }, create: w, update: w })),
    ...expressions.map((e) => db.expression.upsert({ where: { id: e.id }, create: e, update: e })),
  ]);
  return { words: words.length, expressions: expressions.length };
}
