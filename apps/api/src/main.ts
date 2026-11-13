import { createApp } from './app.js';
import { ENV, type Env } from './config/env.js';

const app = await createApp();
await app.listen(app.get<Env>(ENV).PORT, '0.0.0.0');
