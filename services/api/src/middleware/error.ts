import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { config } from "../config.js";

/** Error carrying an explicit HTTP status. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

/** 404 handler for unmatched routes. */
export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

/**
 * Global error handler. Emits proper status codes to consumers with a
 * correlation id, and never leaks stack traces in production (per the security
 * guidance and the Reverse Proxy error contract).
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  const correlationId = randomUUID();

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues,
      correlationId,
    });
  }

  if (err instanceof HttpError) {
    return res
      .status(err.status)
      .json({ error: err.message, correlationId });
  }

  console.error(`[error] ${correlationId}`, err);
  res.status(500).json({
    error: "Internal server error",
    correlationId,
    ...(config.isProduction
      ? {}
      : { detail: err instanceof Error ? err.message : String(err) }),
  });
}
