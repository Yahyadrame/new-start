// Générateur : `pnpm gen:module <nom>` (apps/api).
/* eslint-disable security/detect-non-literal-fs-filename -- les chemins viennent d'un nom validé en kebab-case */
// Le nom est en kebab-case. Le code produit respecte les règles d'import de .dependency-cruiser.cjs
// et vient avec ses tests unitaires.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';

const NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function names(name) {
  if (!NAME.test(name)) {
    throw new Error(`Nom invalide « ${name} » : kebab-case attendu (ex. quiz-game).`);
  }
  return {
    kebab: name,
    pascal: name.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase()),
    camel: name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()),
    token: name.toUpperCase().replaceAll('-', '_'),
  };
}

/** Fichiers d'un module back : chemin relatif à apps/api/src/modules/<nom>. */
export function moduleFiles(name) {
  const { kebab: k, pascal: P, token: T } = names(name);
  return {
    [`domain/${k}.ts`]: `export type ${P} = { id: string };

export interface ${P}Repository {
  findById(id: string): Promise<${P} | null>;
}

export const ${T}_REPOSITORY = Symbol('${P}Repository');
`,
    [`application/get-${k}.ts`]: `import { Inject, Injectable } from '@nestjs/common';
import { ${T}_REPOSITORY, type ${P}, type ${P}Repository } from '../domain/${k}.js';

@Injectable()
export class Get${P} {
  constructor(@Inject(${T}_REPOSITORY) private readonly repository: ${P}Repository) {}

  execute(id: string): Promise<${P} | null> {
    return this.repository.findById(id);
  }
}
`,
    [`application/get-${k}.test.ts`]: `import { describe, expect, it } from 'vitest';
import type { ${P}Repository } from '../domain/${k}.js';
import { Get${P} } from './get-${k}.js';

const repository: ${P}Repository = {
  findById: async (id) => (id === '1' ? { id } : null),
};

describe('Get${P}', () => {
  it("renvoie l'élément trouvé", async () => {
    expect(await new Get${P}(repository).execute('1')).toEqual({ id: '1' });
  });
  it("renvoie null quand l'élément n'existe pas", async () => {
    expect(await new Get${P}(repository).execute('2')).toBeNull();
  });
});
`,
    [`infrastructure/in-memory-${k}.repository.ts`]: `import { Injectable } from '@nestjs/common';
import type { ${P}, ${P}Repository } from '../domain/${k}.js';

/** Adaptateur provisoire : à remplacer par Prisma quand le modèle de données existe. */
@Injectable()
export class InMemory${P}Repository implements ${P}Repository {
  private readonly items = new Map<string, ${P}>();

  async findById(id: string): Promise<${P} | null> {
    return this.items.get(id) ?? null;
  }

  async save(item: ${P}): Promise<void> {
    this.items.set(item.id, item);
  }
}
`,
    [`infrastructure/in-memory-${k}.repository.test.ts`]: `import { describe, expect, it } from 'vitest';
import { InMemory${P}Repository } from './in-memory-${k}.repository.js';

describe('InMemory${P}Repository', () => {
  it('retrouve ce qui a été enregistré', async () => {
    const repository = new InMemory${P}Repository();
    await repository.save({ id: '1' });
    expect(await repository.findById('1')).toEqual({ id: '1' });
  });
  it('renvoie null pour un identifiant inconnu', async () => {
    expect(await new InMemory${P}Repository().findById('x')).toBeNull();
  });
});
`,
    [`interface/${k}.controller.ts`]: `import { Controller, Get, Inject, NotFoundException, Param } from '@nestjs/common';
import { Get${P} } from '../application/get-${k}.js';
import type { ${P} } from '../domain/${k}.js';

@Controller('${k}')
export class ${P}Controller {
  constructor(@Inject(Get${P}) private readonly get${P}: Get${P}) {}

  @Get(':id')
  async get(@Param('id') id: string): Promise<${P}> {
    const item = await this.get${P}.execute(id);
    if (!item) throw new NotFoundException({ code: '${T}_NOT_FOUND', message: 'Introuvable.' });
    return item;
  }
}
`,
    [`interface/${k}.controller.test.ts`]: `import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Get${P} } from '../application/get-${k}.js';
import { ${T}_REPOSITORY } from '../domain/${k}.js';
import { ${P}Controller } from './${k}.controller.js';

let app: INestApplication;

beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [${P}Controller],
    providers: [
      Get${P},
      { provide: ${T}_REPOSITORY, useValue: { findById: async (id: string) => (id === '1' ? { id } : null) } },
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(() => app.close());

describe('${P}Controller', () => {
  it('renvoie 200 et l\\'élément', async () => {
    const res = await request(app.getHttpServer()).get('/${k}/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: '1' });
  });
  it('renvoie 404 avec un code stable', async () => {
    const res = await request(app.getHttpServer()).get('/${k}/2');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('${T}_NOT_FOUND');
  });
});
`,
    [`${k}.module.ts`]: `import { Module } from '@nestjs/common';
import { Get${P} } from './application/get-${k}.js';
import { ${T}_REPOSITORY } from './domain/${k}.js';
import { InMemory${P}Repository } from './infrastructure/in-memory-${k}.repository.js';
import { ${P}Controller } from './interface/${k}.controller.js';

@Module({
  controllers: [${P}Controller],
  providers: [Get${P}, { provide: ${T}_REPOSITORY, useClass: InMemory${P}Repository }],
})
export class ${P}Module {}
`,
  };
}

/** Écrit les fichiers sous `dir`. Refuse d'écraser un dossier existant. */
export function write(dir, files) {
  if (existsSync(dir)) throw new Error(`${dir} existe déjà, rien n'a été écrit.`);
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return Object.keys(files).map((p) => join(dir, p));
}

export function run(kind, name, root = process.cwd()) {
  if (kind === 'module') {
    const written = write(join(root, 'apps/api/src/modules', name), moduleFiles(name));
    const { pascal } = names(name);
    return { written, hint: `Ajoute ${pascal}Module aux imports de apps/api/src/app.module.ts.` };
  }
  throw new Error(`Type inconnu « ${kind} » : module.`);
}

/** Point d'entrée de la ligne de commande : renvoie le code de sortie et le texte à afficher. */
export function main(args, root = process.cwd()) {
  try {
    const [kind, name] = args;
    const { written, hint } = run(kind, name ?? '', root);
    return { code: 0, out: written.join('\n') + '\n' + hint };
  } catch (error) {
    return { code: 1, out: error.message };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { code, out } = main(process.argv.slice(2));
  process.stdout.write(out + '\n');
  process.exitCode = code;
}
