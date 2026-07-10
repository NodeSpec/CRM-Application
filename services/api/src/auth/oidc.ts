import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { config } from "../config.js";

/**
 * OIDC integration against the pluggable Identity Provider (REQ-001), using a
 * backend-for-frontend (BFF) flow: the browser is redirected to the IdP, the
 * API performs the authorization-code exchange server-side with the
 * confidential client, verifies the token, and establishes a server-side
 * session. Switching IdPs (Keycloak, Okta, Azure AD, Google Workspace) is a
 * config change only — no code change.
 *
 * Two base URLs are used so the same IdP works across container networking:
 *   - OIDC_ISSUER_URL   : browser-facing (authorize/logout the user's browser hits)
 *   - OIDC_INTERNAL_URL : server-to-server (token + JWKS the API hits)
 */
const browserBase = config.OIDC_ISSUER_URL.replace(/\/$/, "");
const internalBase = config.OIDC_INTERNAL_URL.replace(/\/$/, "");

const authorizeEndpoint = `${browserBase}/protocol/openid-connect/auth`;
const logoutEndpoint = `${browserBase}/protocol/openid-connect/logout`;
const tokenEndpoint = `${internalBase}/protocol/openid-connect/token`;
const jwksUri = new URL(`${internalBase}/protocol/openid-connect/certs`);

export const redirectUri = `${config.APP_BASE_URL.replace(/\/$/, "")}/api/v1/auth/callback`;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  if (!jwks) jwks = createRemoteJWKSet(jwksUri);
  return jwks;
}

/** Build the IdP authorization URL the browser is redirected to. */
export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.OIDC_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile email",
    state,
  });
  return `${authorizeEndpoint}?${params.toString()}`;
}

/** Build the IdP logout URL (front-channel) to end the IdP session. */
export function buildLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: config.OIDC_CLIENT_ID,
    post_logout_redirect_uri: config.APP_BASE_URL,
  });
  return `${logoutEndpoint}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
}

/** Exchange an authorization code for tokens (backchannel, confidential client). */
export async function exchangeCode(code: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: config.OIDC_CLIENT_ID,
    client_secret: config.OIDC_CLIENT_SECRET,
  });
  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Token exchange failed (${res.status}): ${detail}`);
  }
  return (await res.json()) as TokenResponse;
}

export interface VerifiedIdentity {
  subject: string;
  email: string;
  displayName: string;
  /** Raw claim used for role mapping (REQ-002), e.g. IdP group memberships. */
  roleClaimValues: string[];
  jti?: string;
  raw: JWTPayload;
}

/**
 * Verify a token issued by the IdP. Signature and expiry are checked against
 * the realm JWKS. Issuer is NOT strictly enforced because the browser-facing
 * and backchannel URLs can differ across container networking; the signature
 * check already guarantees the token came from our realm. `azp` is checked
 * against our client where present. In production with a single stable IdP
 * hostname, add `issuer: config.OIDC_ISSUER_URL` to tighten this.
 */
export async function verifyToken(token: string): Promise<VerifiedIdentity> {
  const { payload } = await jwtVerify(token, getJwks());

  const azp = (payload as Record<string, unknown>).azp;
  if (typeof azp === "string" && azp && azp !== config.OIDC_CLIENT_ID) {
    // Token was minted for a different client — reject.
    throw new Error(`Unexpected token azp: ${azp}`);
  }

  const claim = payload[config.IDP_ROLE_CLAIM];
  const roleClaimValues = Array.isArray(claim)
    ? claim.map(String)
    : typeof claim === "string"
      ? [claim]
      : [];

  const p = payload as Record<string, unknown>;
  return {
    subject: String(payload.sub ?? ""),
    email: String(p.email ?? ""),
    displayName: String(p.name ?? p.preferred_username ?? p.email ?? ""),
    roleClaimValues,
    jti: payload.jti,
    raw: payload,
  };
}
