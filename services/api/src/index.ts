import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { migrate } from "./db/migrate.js";
import { pool } from "./db/pool.js";
import { redis } from "./redis.js";
import { v1Router } from "./routes/index.js";
import { docsRouter } from "./openapi.js";
import { errorHandler, notFound } from "./middleware/error.js";

/**
 * CRM API entrypoint. Runs pending migrations BEFORE listening (REQ-017 AC2),
 * mounts the versioned API and docs, and installs security + error middleware.
 */
async function main() {
  const app = express();

  // CSP is disabled so the Swagger UI at /api/docs renders its inline assets;
  // the SPA is served by a separate nginx, so this only affects API responses.
  // Re-enable a tailored CSP in production if docs are gated or moved.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Liveness/readiness probe used by the container healthcheck.
  app.get("/healthz", (_req, res) => res.json({ status: "ok" }));

  // OpenAPI docs (REQ-016).
  app.use("/api/docs", docsRouter);

  // Versioned API (REQ-016).
  app.use("/api/v1", v1Router);

  app.use(notFound);
  app.use(errorHandler);

  // Run migrations before accepting traffic (REQ-017).
  await migrate();

  const server = app.listen(config.PORT, () => {
    console.log(`[api] listening on :${config.PORT} (${config.NODE_ENV})`);
  });

  // Graceful shutdown: drain connections and close pools.
  const shutdown = async (signal: string) => {
    console.log(`[api] ${signal} received, shutting down`);
    server.close(async () => {
      await pool.end().catch(() => {});
      redis.disconnect();
      process.exit(0);
    });
    // Force-exit if graceful close hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("[api] fatal startup error", err);
  process.exit(1);
});
