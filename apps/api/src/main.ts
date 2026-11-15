import { createApp } from './app.js';
import { ENV, parseEnv, type Env } from './config/env.js';
import { initOtel } from './shared/monitoring/otel.js';
import { initSentry } from './shared/monitoring/sentry.js';

const env = parseEnv(process.env);
initSentry(env);
initOtel(env);

const app = await createApp();
await app.listen(app.get<Env>(ENV).PORT, '0.0.0.0');
