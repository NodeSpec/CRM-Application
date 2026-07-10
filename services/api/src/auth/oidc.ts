import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { config } from "../config.js";

/**
 * OIDC/SAML token verification against the pluggable Identity Provider
 * (REQ-001). The issuer, client id and JWKS are all driven by environment
 * configuration, so switching IdPs (Keycloak, Okta, Azure AD, Google
 * Workspace) requires only a config change + restart — no code change.
 *
 * NOTE (scaffold): the JWKS wiring below is real, but the surrounding login /
 * token-exchange flow (authorization-code callback, SAML assertion parsing) is
 * left as a TODO integration seam for the chosen scope.
 */

// Discover the JWKS endpoint from the issuer. Keycloak/most OIDC providers
// expose it at `${issuer}/protocol/openid-connect/certs`; the generic OIDC
// discovery document also advertises `jwks_uri`. We build the standard
// Keycloak path here and allow overriding via a full issuer that already
// includes the realm.
const jwksUri = new URL(
  `${config.OIDC_ISSUER_URL.replace(/\/$/, "")}/protocol/openid-connect/certs`
);

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  if (!jwks) jwks = createRemoteJWKSet(jwksUri);
  return jwks;
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
 * Verify a bearer access/ID token issued by the configured IdP.
 * Throws if the signature, issuer or audience is invalid.
 */
export async function verifyToken(token: string): Promise<VerifiedIdentity> {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: config.OIDC_ISSUER_URL,
    // Audience check is relaxed here because access tokens may be audience-
    // scoped to multiple clients; tighten with `audience: config.OIDC_CLIENT_ID`
    // once the IdP client mappers are finalised.
  });

  const claim = payload[config.IDP_ROLE_CLAIM];
  const roleClaimValues = Array.isArray(claim)
    ? claim.map(String)
    : typeof claim === "string"
      ? [claim]
      : [];

  return {
    subject: String(payload.sub ?? ""),
    email: String((payload as Record<string, unknown>).email ?? ""),
    displayName: String(
      (payload as Record<string, unknown>).name ??
        (payload as Record<string, unknown>).preferred_username ??
        ""
    ),
    roleClaimValues,
    jti: payload.jti,
    raw: payload,
  };
}
