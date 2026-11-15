// Générateurs : `pnpm gen:module <nom>` (apps/api) et `pnpm gen:feature <nom>` (apps/web).
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

/** Fichiers d'une fonctionnalité front : chemin relatif à apps/web/src/features/<nom>. */
export function featureFiles(name) {
  const { kebab: k, pascal: P, camel: c } = names(name);
  return {
    [`api/${k}.ts`]: `export type ${P} = { id: string };

/** Appelle l'API ; l'URL vient de NEXT_PUBLIC_API_URL. */
export async function fetch${P}(id: string): Promise<${P}> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  const res = await fetch(\`\${base}/${k}/\${encodeURIComponent(id)}\`);
  if (!res.ok) throw new Error(\`${k}: \${res.status}\`);
  return (await res.json()) as ${P};
}
`,
    [`api/${k}.test.ts`]: `import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetch${P} } from './${k}';

afterEach(() => vi.unstubAllGlobals());

describe('fetch${P}', () => {
  it("renvoie l'élément de l'API", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: 'a b' }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetch${P}('a b')).toEqual({ id: 'a b' });
    expect(fetchMock).toHaveBeenCalledWith('/${k}/a%20b');
  });
  it('lève une erreur si l\\'API refuse', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 404 })));
    await expect(fetch${P}('x')).rejects.toThrow('${k}: 404');
  });
});
`,
    [`store/${k}-store.ts`]: `import type { ${P} } from '../api/${k}';

export type ${P}State = { status: 'idle' | 'loading' | 'ready' | 'error'; item: ${P} | null };

export type ${P}Action =
  | { type: 'load' }
  | { type: 'loaded'; item: ${P} }
  | { type: 'failed' };

export const initial${P}State: ${P}State = { status: 'idle', item: null };

export function ${c}Reducer(state: ${P}State, action: ${P}Action): ${P}State {
  switch (action.type) {
    case 'load':
      return { ...state, status: 'loading' };
    case 'loaded':
      return { status: 'ready', item: action.item };
    case 'failed':
      return { ...state, status: 'error' };
  }
}
`,
    [`store/${k}-store.test.ts`]: `import { describe, expect, it } from 'vitest';
import { initial${P}State, ${c}Reducer } from './${k}-store';

describe('${c}Reducer', () => {
  it('passe de idle à loading puis ready', () => {
    const loading = ${c}Reducer(initial${P}State, { type: 'load' });
    expect(loading.status).toBe('loading');
    expect(${c}Reducer(loading, { type: 'loaded', item: { id: '1' } })).toEqual({
      status: 'ready',
      item: { id: '1' },
    });
  });
  it('passe en error sans perdre l\\'élément déjà chargé', () => {
    const ready = { status: 'ready' as const, item: { id: '1' } };
    expect(${c}Reducer(ready, { type: 'failed' })).toEqual({ status: 'error', item: { id: '1' } });
  });
});
`,
    [`hooks/use-${k}.ts`]: `'use client';
import { useEffect, useReducer } from 'react';
import { fetch${P} } from '../api/${k}';
import { initial${P}State, ${c}Reducer } from '../store/${k}-store';

export function use${P}(id: string) {
  const [state, dispatch] = useReducer(${c}Reducer, initial${P}State);
  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'load' });
    fetch${P}(id)
      .then((item) => !cancelled && dispatch({ type: 'loaded', item }))
      .catch(() => !cancelled && dispatch({ type: 'failed' }));
    return () => {
      cancelled = true;
    };
  }, [id]);
  return state;
}
`,
    [`hooks/use-${k}.test.ts`]: `import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { use${P} } from './use-${k}';

afterEach(() => vi.unstubAllGlobals());

describe('use${P}', () => {
  it("charge l'élément", async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ id: '1' })));
    const { result } = renderHook(() => use${P}('1'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.item).toEqual({ id: '1' });
  });
  it('passe en error si l\\'API échoue', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 500 })));
    const { result } = renderHook(() => use${P}('1'));
    await waitFor(() => expect(result.current.status).toBe('error'));
  });
});
`,
    [`components/${k}-panel.tsx`]: `'use client';
import { use${P} } from '../hooks/use-${k}';

type Props = { id: string; label: string; errorMessage: string };

/** Les textes viennent des fichiers de traduction, jamais écrits en dur ici. */
export function ${P}Panel({ id, label, errorMessage }: Props) {
  const { status, item } = use${P}(id);
  return (
    <section aria-label={label}>
      {status === 'error' ? <p role="alert">{errorMessage}</p> : null}
      {item ? <p>{item.id}</p> : null}
    </section>
  );
}
`,
    [`components/${k}-panel.test.tsx`]: `import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ${P}Panel } from './${k}-panel';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('${P}Panel', () => {
  it("affiche l'élément chargé", async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ id: 'abc' })));
    render(<${P}Panel id="abc" label="Exemple" errorMessage="Erreur" />);
    expect(await screen.findByText('abc')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Exemple' })).toBeTruthy();
  });
  it("annonce l'erreur", async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 500 })));
    render(<${P}Panel id="abc" label="Exemple" errorMessage="Erreur" />);
    expect((await screen.findByRole('alert')).textContent).toBe('Erreur');
  });
});
`,
    ['index.ts']: `export { ${P}Panel } from './components/${k}-panel';
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
  if (kind === 'feature') {
    const written = write(join(root, 'apps/web/src/features', name), featureFiles(name));
    return {
      written,
      hint: `Importe depuis '@/features/${name}' (index.ts), jamais depuis un sous-dossier.`,
    };
  }
  throw new Error(`Type inconnu « ${kind} » : module ou feature.`);
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
