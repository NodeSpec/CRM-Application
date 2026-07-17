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

  // Public base URL the browser uses to reach the app (through the proxy).
  // Used to build OIDC redirect URIs and the post-login redirect.
  APP_BASE_URL: z.string().min(1).default("http://localhost"),

  // Identity Provider / OIDC (REQ-001).
  // Browser-facing issuer/authorize base (reachable from the user's browser).
  OIDC_ISSUER_URL: z.string().min(1, "OIDC_ISSUER_URL is required"),
  // Server-to-server base for token exchange + JWKS (reachable from the API
  // container). Defaults to the browser-facing issuer when not split.
  OIDC_INTERNAL_URL: z.string().optional().default(""),
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

  // Social profile integrations (REQ-026). Outbound calls to third-party social
  // platforms MUST route through a dedicated egress gateway (allowlist + rate
  // limiting + credential injection) rather than being made directly from app
  // code. SOCIAL_EGRESS_BASE_URL is that gateway's base; the *_TOKEN vars hold
  // per-provider credentials. When a provider's credential is absent the feed
  // reports "not connected" and returns no posts — never fabricated data.
  SOCIAL_EGRESS_BASE_URL: z.string().optional().default(""),
  SOCIAL_LINKEDIN_TOKEN: z.string().optional().default(""),
  SOCIAL_X_TOKEN: z.string().optional().default(""),
  SOCIAL_INSTAGRAM_TOKEN: z.string().optional().default(""),
  SOCIAL_TIKTOK_TOKEN: z.string().optional().default(""),

  // Email / calendar invite delivery (REQ-027). Server-side sending of event
  // invites (so attendees receive the email directly, without the organizer's
  // mail client) routes through an email gateway (SMTP relay or Microsoft Graph)
  // reached via the egress gateway. When EMAIL_GATEWAY_URL is unset the invite
  // endpoint returns the generated .ics with delivered=false — it never claims
  // to have sent mail it couldn't. Client-side Outlook/Google/.ics flows need
  // none of this.
  EMAIL_GATEWAY_URL: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default(""),
  EMAIL_API_TOKEN: z.string().optional().default(""),
});

export type AppConfig = z.infer<typeof EnvSchema> & {
  isProduction: boolean;
  featureFlags: string[];
  /** Per-platform social API credential presence/value, keyed by platform. */
  socialCredentials: Record<
    "linkedin" | "x" | "instagram" | "tiktok",
    string
  >;
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
    // Fall back to the browser-facing issuer for backchannel calls if unset.
    OIDC_INTERNAL_URL: env.OIDC_INTERNAL_URL || env.OIDC_ISSUER_URL,
    isProduction: env.NODE_ENV === "production",
    featureFlags: env.FEATURE_FLAGS.split(",")
      .map((f) => f.trim())
      .filter(Boolean),
    socialCredentials: {
      linkedin: env.SOCIAL_LINKEDIN_TOKEN,
      x: env.SOCIAL_X_TOKEN,
      instagram: env.SOCIAL_INSTAGRAM_TOKEN,
      tiktok: env.SOCIAL_TIKTOK_TOKEN,
    },
  };
}

export const config = loadConfig();
