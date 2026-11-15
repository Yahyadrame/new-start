import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { BatchSpanProcessor, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import type { Env } from '../../config/env.js';

// Éteint tant que OTEL_EXPORTER_OTLP_ENDPOINT est vide : aucun fournisseur créé, rien ne part.
// L'exporteur lit aussi OTEL_EXPORTER_OTLP_HEADERS (jeton Grafana Cloud) dans l'environnement.
// ponytail: traces HTTP seulement, sans métriques ni logs ; à étendre quand Grafana Cloud est branché.
export function initOtel(env: Pick<Env, 'OTEL_EXPORTER_OTLP_ENDPOINT'>): boolean {
  const endpoint = env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return false;
  process.env['OTEL_SERVICE_NAME'] ??= 'newstart-api';
  const provider = new NodeTracerProvider({
    spanProcessors: [
      new BatchSpanProcessor(new OTLPTraceExporter({ url: `${endpoint}/v1/traces` })),
    ],
  });
  provider.register();
  new HttpInstrumentation().enable();
  return true;
}
