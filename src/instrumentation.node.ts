// src/instrumentation.node.ts
//
// Node.js-only OpenTelemetry SDK bootstrap.
// Imported dynamically by instrumentation.ts when NEXT_RUNTIME === "nodejs".
// This file must NEVER be imported from Edge or Client bundles.

import { NodeSDK } from "@opentelemetry/sdk-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";

const OTLP_ENDPOINT =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://127.0.0.1:4317";

const sdk = new NodeSDK({
  // ── Resource: tags every span and metric with service identity ──
    resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "neiist-website",
    [ATTR_SERVICE_VERSION]: process.env.npm_package_version || "3.0.0",
    "deployment.environment": process.env.NODE_ENV || "development",
    }),

  // ── Trace exporter: gRPC push to Alloy / OTel Collector ──
  traceExporter: new OTLPTraceExporter({
    url: OTLP_ENDPOINT,
  }),

  // ── Metric reader: periodic export every 60 s ──
  metricReader: [new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: OTLP_ENDPOINT,
    }),
    exportIntervalMillis: 60_000, // flush metrics every minute
  })],

  // ── Auto-instrumentations ──
  instrumentations: [
    getNodeAutoInstrumentations({
      // HTTP: auto-creates spans for every incoming/outgoing HTTP request.
      // Next.js route handler calls, fetch() to Fénix/Notion/Google,
      // and SumUp API calls all get traced automatically.
      "@opentelemetry/instrumentation-http": {
        enabled: true,
      },

      // pg: auto-creates child spans for every SQL query through the
      // pg.Pool in src/lib/db/connection.ts. 
      "@opentelemetry/instrumentation-pg": {
        enabled: true,
        enhancedDatabaseReporting: false, // don't capture query params (PII risk)
      },

      // Pino: auto-injects trace_id, span_id, trace_flags into every
      // Pino log line that happens inside a traced span. This is what
      // makes the "click a log -> jump to trace" feature work in Grafana.
      "@opentelemetry/instrumentation-pino": {
        enabled: true,
      },

      // Disable instrumentations we don't need to reduce noise:
      "@opentelemetry/instrumentation-fs": { enabled: false },
      "@opentelemetry/instrumentation-dns": { enabled: false },
      "@opentelemetry/instrumentation-net": { enabled: false },
    }),
  ],
});

sdk.start();

// ── Graceful shutdown: flush pending spans/metrics before exit ──
const shutdown = async () => {
  try {
    await sdk.shutdown();
  } catch (err) {
    console.error("[OTel] SDK shutdown error:", err);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);