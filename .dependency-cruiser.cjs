// Règles d'architecture de docs/06-architecture.md, vérifiées en CI (`pnpm depcruise`).
const web = 'apps/web/src';
const modules = 'apps/(?:api|worker)/src/modules';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    // Front : app → features → entities → shared
    {
      name: 'web-shared-ne-remonte-pas',
      severity: 'error',
      from: { path: `^${web}/shared/` },
      to: { path: `^${web}/(?:entities|features|app)/` },
    },
    {
      name: 'web-entities-ne-remonte-pas',
      severity: 'error',
      from: { path: `^${web}/entities/` },
      to: { path: `^${web}/(?:features|app)/` },
    },
    {
      name: 'web-features-ne-remonte-pas',
      severity: 'error',
      from: { path: `^${web}/features/` },
      to: { path: `^${web}/app/` },
    },
    {
      name: 'web-pas-de-fonctionnalite-vers-fonctionnalite',
      severity: 'error',
      from: { path: `^${web}/features/([^/]+)/` },
      to: { path: `^${web}/features/`, pathNot: `^${web}/features/$1/` },
    },
    {
      name: 'web-fonctionnalite-par-son-index',
      comment: "Une fonctionnalité n'expose que son index.ts.",
      severity: 'error',
      from: { path: `^${web}/(?:app|entities|shared)/` },
      to: { path: `^${web}/features/[^/]+/`, pathNot: `^${web}/features/[^/]+/index\\.tsx?$` },
    },
    // Bibliothèques partagées : jamais d'import vers une appli
    {
      name: 'packages-sans-apps',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
    // Back : domain → application → infrastructure / interface, modules isolés
    {
      name: 'back-domain-pur',
      severity: 'error',
      from: { path: `^${modules}/[^/]+/domain/` },
      to: { path: `^${modules}/[^/]+/(?:application|infrastructure|interface)/` },
    },
    {
      name: 'back-application-sans-infra',
      severity: 'error',
      from: { path: `^${modules}/[^/]+/application/` },
      to: { path: `^${modules}/[^/]+/(?:infrastructure|interface)/` },
    },
    {
      name: 'back-infrastructure-sans-interface',
      severity: 'error',
      from: { path: `^${modules}/[^/]+/infrastructure/` },
      to: { path: `^${modules}/[^/]+/interface/` },
    },
    {
      name: 'back-pas-de-module-vers-module',
      comment: 'Les modules communiquent par événements de domaine, jamais par import.',
      severity: 'error',
      from: { path: `^${modules}/([^/]+)/` },
      to: { path: `^${modules}/`, pathNot: `^${modules}/$1/` },
    },
  ],
  options: { doNotFollow: { path: 'node_modules' } },
};
