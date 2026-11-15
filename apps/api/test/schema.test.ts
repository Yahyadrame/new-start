import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schema = readFileSync('prisma/schema.prisma', 'utf8');
const models = [...schema.matchAll(/^model (\w+) \{([^}]*)\}/gm)].map((m) => ({
  name: m[1],
  body: m[2] ?? '',
}));

describe('schema Prisma', () => {
  it('contient les modèles de NS-101', () => {
    const names = models.map((m) => m.name);
    for (const n of [
      'User',
      'AuthIdentity',
      'RefreshToken',
      'Topic',
      'Agent',
      'Conversation',
      'Message',
      'Correction',
      'Expression',
      'Word',
    ])
      expect(names).toContain(n);
  });
  it('donne un UUID v7, createdAt et updatedAt à chaque table de compte et de conversation', () => {
    const noyau = new Set(['Expression', 'Word']);
    for (const m of models.filter((x) => !noyau.has(x.name ?? ''))) {
      expect(m.body, m.name).toContain('@default(uuid(7))');
      expect(m.body, m.name).toMatch(/createdAt\s+DateTime\s+@default\(now\(\)\)/);
      expect(m.body, m.name).toMatch(/updatedAt\s+DateTime\s+@updatedAt/);
    }
  });
  it('supprime les données du compte avec le compte', () => {
    const body = (name: string) => models.find((m) => m.name === name)?.body ?? '';
    for (const n of ['AuthIdentity', 'RefreshToken', 'Conversation'])
      expect(body(n)).toContain('onDelete: Cascade');
    expect(body('Message')).toContain('onDelete: Cascade');
  });
  it('garde le numéro de téléphone unique et le consentement SMS décoché', () => {
    const user = models.find((m) => m.name === 'User')?.body ?? '';
    expect(user).toMatch(/phoneE164\s+String\?\s+@unique/);
    expect(user).toMatch(/smsOptIn\s+Boolean\s+@default\(false\)/);
  });
});

describe('migrations', () => {
  it('étendent sans rien supprimer (étendre puis contracter)', () => {
    const dirs = readdirSync('prisma/migrations', { withFileTypes: true }).filter((d) =>
      d.isDirectory(),
    );
    expect(dirs.length).toBeGreaterThan(1);
    for (const d of dirs) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- noms issus de readdirSync
      const sql = readFileSync(`prisma/migrations/${d.name}/migration.sql`, 'utf8');
      expect(sql, d.name).not.toMatch(/\bDROP\s+(TABLE|COLUMN)\b/i);
    }
  });
});
