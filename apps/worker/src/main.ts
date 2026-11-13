import { createWorker } from './app.js';
import { startHeartbeat } from './heartbeat.js';

await createWorker();
// Sert au HEALTHCHECK Docker et garde le processus en vie ; arrêté proprement sur SIGTERM/SIGINT.
const stop = startHeartbeat(process.env['HEARTBEAT_FILE'] ?? '/tmp/worker-alive');
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
