import { Router } from "express";
import { pool } from "../../db/pool.js";
import { config } from "../../config.js";
import { HttpError } from "../../middleware/error.js";

/**
 * Company social activity feed (REQ-026).
 *
 * The company stores official profile URLs per platform (companies.social_links).
 * This router renders those channels and, for each connected platform, returns
 * the recent posts fetched by that platform's provider.
 *
 * IMPORTANT — no fabricated data. A provider only returns posts when its API
 * credential is configured (config.socialCredentials[...]) AND the outbound call
 * succeeds. Live fetching MUST go through the egress gateway
 * (config.SOCIAL_EGRESS_BASE_URL); direct third-party calls from app code are a
 * policy violation. Until a credential + egress are supplied a channel reports
 * connected:true, configured:false and an empty post list, so the UI can show an
 * honest "connect a platform API to see posts" state instead of inventing posts.
 */
export const PLATFORMS = ["linkedin", "x", "instagram", "tiktok"] as const;
export type Platform = (typeof PLATFORMS)[number];

export interface SocialPost {
  id: string;
  text: string;
  posted_at: string;
  url?: string;
  likes?: number;
  comments?: number;
  shares?: number;
}

/** A provider knows how to fetch a profile's recent posts from one platform. */
interface SocialProvider {
  readonly platform: Platform;
  /** True when this platform's API credential is present in the environment. */
  isConfigured(): boolean;
  /** Recent posts for `profile` (URL or handle); [] when not configured. */
  fetchPosts(profile: string): Promise<SocialPost[]>;
}

/**
 * Default provider: credential- and egress-gated. The real API call belongs
 * where noted below — it is intentionally left unwired so nothing fabricates
 * posts. Supplying the credential + egress base and implementing the fetch is
 * the single seam that turns this live.
 */
class GatewayProvider implements SocialProvider {
  constructor(public readonly platform: Platform) {}
  isConfigured(): boolean {
    return Boolean(config.socialCredentials[this.platform]);
  }
  async fetchPosts(_profile: string): Promise<SocialPost[]> {
    if (!this.isConfigured() || !config.SOCIAL_EGRESS_BASE_URL) return [];
    // Real integration point (REQ-026): call the platform's official API through
    // the egress gateway, e.g.
    //   fetch(`${config.SOCIAL_EGRESS_BASE_URL}/${this.platform}/posts?...`, {
    //     headers: { authorization: `Bearer ${config.socialCredentials[...]}` },
    //   })
    // then normalize the response into SocialPost[]. Not implemented yet — we
    // return [] rather than inventing data.
    return [];
  }
}

const providers: Record<Platform, SocialProvider> = {
  linkedin: new GatewayProvider("linkedin"),
  x: new GatewayProvider("x"),
  instagram: new GatewayProvider("instagram"),
  tiktok: new GatewayProvider("tiktok"),
};

export interface ChannelFeed {
  platform: Platform;
  /** A profile URL is saved for this platform. */
  connected: boolean;
  url?: string;
  /** The platform's API credential is present (feed can go live). */
  configured: boolean;
  posts: SocialPost[];
  /** Why the post list is empty, for the UI to surface honestly. */
  reason: string | null;
}

/** Mounted at /companies so it composes with the companies CRUD router. */
export const companySocialRouter = Router();

companySocialRouter.get("/:id/social-feed", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT social_links FROM companies WHERE id = $1",
      [req.params.id]
    );
    if (!rows[0]) throw new HttpError(404, "Not found");
    const links: Record<string, string> = rows[0].social_links ?? {};

    const channels: ChannelFeed[] = await Promise.all(
      PLATFORMS.map(async (platform) => {
        const url = (links[platform] ?? "").trim();
        const provider = providers[platform];
        const configured = provider.isConfigured();
        if (!url) {
          return { platform, connected: false, configured, posts: [], reason: null };
        }
        const posts = configured
          ? await provider.fetchPosts(url).catch(() => [] as SocialPost[])
          : [];
        return {
          platform,
          connected: true,
          url,
          configured,
          posts,
          reason: configured
            ? posts.length
              ? null
              : "No recent posts"
            : "Platform API not connected",
        };
      })
    );

    res.json({
      channels,
      // Any platform live? Drives the "Auto-synced" vs pending badge in the UI.
      live: channels.some((c) => c.connected && c.configured),
    });
  } catch (err) {
    next(err);
  }
});
