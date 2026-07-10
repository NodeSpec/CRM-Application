import { z } from "zod";

/**
 * Environment configuration with fail-fast validation (REQ-015).
 *
 * Every environment-specific value the API needs is declared here and parsed
 * from `process.env`. If a required variable is missing or malformed the app
 * exits at startup with a descriptive message instead of failing later at an
 * unpredictable point (REQ-015 AC2). No secrets are hardcoded anywhere in the
 * source tree — they arrive exclusively through the environment (REQ-015 AC3).
 */
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  // Persistence (CRM Database).
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  MIGRATIONS_DIR: z.string().default("/app/db/migrations"),

  // Session Store (Redis).
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  // Session & cookies (REQ-003).
  SESSION_SECRET: z
    .string()
    .min(16, "SESSION_SECRET must be at least 16 characters"),
  SESSION_IDLE_TIMEOUT_MIN: z.coerce.number().int().positive().default(30),
  COOKIE_SECURE: z
    .string()
    .transform((v) => v === "true")
    .default("false"),

  // Identity Provider / OIDC (REQ-001).
  OIDC_ISSUER_URL: z.string().min(1, "OIDC_ISSUER_URL is required"),
  OIDC_CLIENT_ID: z.string().min(1, "OIDC_CLIENT_ID is required"),
  OIDC_CLIENT_SECRET: z.string().optional().default(""),
  SAML_METADATA_URL: z.string().optional().default(""),
  IDP_ROLE_CLAIM: z.string().default("groups"),

  // Alert thresholds / feature flags (REQ-008, REQ-010, REQ-015).
  B2G_DUE_DATE_THRESHOLD_DAYS: z.coerce.number().int().positive().default(14),
  SUBMISSION_DEADLINE_THRESHOLD_DAYS: z.coerce
    .number()
    .int()
    .positive()
    .default(14),
  FEATURE_FLAGS: z.string().optional().default(""),
});

export type AppConfig = z.infer<typeof EnvSchema> & {
  isProduction: boolean;
  featureFlags: string[];
};

function loadConfig(): AppConfig {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    // Fail fast with a descriptive error and a non-zero exit (REQ-015 AC2).
    console.error(
      `\n[config] Invalid or missing environment configuration:\n${issues}\n\n` +
        `See .env.example for the full list of supported variables.\n`
    );
    process.exit(1);
  }

  const env = parsed.data;
  return {
    ...env,
    isProduction: env.NODE_ENV === "production",
    featureFlags: env.FEATURE_FLAGS.split(",")
      .map((f) => f.trim())
      .filter(Boolean),
  };
}

export const config = loadConfig();
