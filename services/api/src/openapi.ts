import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";

/**
 * Serves the OpenAPI 3.x specification and interactive docs at /api/docs
 * (REQ-016 AC2). The spec is a static, version-controlled `openapi.yaml`
 * shipped alongside the compiled code.
 *
 * NOTE: docs are served openly here for discoverability during development.
 * In production, mount `authenticate` before this router to restrict access to
 * authenticated users per REQ-016 AC2.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const specPath = path.join(here, "openapi.yaml");

let spec: object = {};
try {
  spec = YAML.parse(readFileSync(specPath, "utf8"));
} catch (err) {
  console.error("[openapi] failed to load spec", err);
}

export const docsRouter = Router();
docsRouter.get("/openapi.json", (_req, res) => res.json(spec));
docsRouter.use("/", swaggerUi.serve, swaggerUi.setup(spec));
