import { createApp } from './app.js';
import { ENV, parseEnv, type Env } from './config/env.js';
import { initSentry } from './shared/monitoring/sentry.js';

initSentry(parseEnv(process.env));

const app = await createApp();
await app.listen(app.get<Env>(ENV).PORT, '0.0.0.0');
