import { afterEach, describe, expect, it, vi } from 'vitest';

const register = vi.fn();
const enable = vi.fn();
const exporter = vi.fn();
vi.mock('@opentelemetry/sdk-trace-node', () => ({
  NodeTracerProvider: vi.fn(function () {
    return { register };
  }),
  BatchSpanProcessor: vi.fn(),
}));
vi.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: vi.fn(function (o: unknown) {
    exporter(o);
  }),
}));
vi.mock('@opentelemetry/instrumentation-http', () => ({
  HttpInstrumentation: vi.fn(function () {
    return { enable };
  }),
}));

const { initOtel } = await import('./otel.js');

afterEach(() => vi.clearAllMocks());

describe('initOtel', () => {
  it('ne fait rien sans endpoint', () => {
    expect(initOtel({ OTEL_EXPORTER_OTLP_ENDPOINT: undefined })).toBe(false);
    expect(register).not.toHaveBeenCalled();
    expect(enable).not.toHaveBeenCalled();
  });
  it("s'active avec un endpoint et vise /v1/traces", () => {
    expect(initOtel({ OTEL_EXPORTER_OTLP_ENDPOINT: 'https://otlp.example.net/otlp' })).toBe(true);
    expect(exporter).toHaveBeenCalledWith({ url: 'https://otlp.example.net/otlp/v1/traces' });
    expect(register).toHaveBeenCalledOnce();
    expect(enable).toHaveBeenCalledOnce();
  });
});
