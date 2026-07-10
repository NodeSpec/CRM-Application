# Task: Session Store

## Component Purpose

**Role:** Cache
**Technology:** Redis
**Description:** In-memory data caching layer
**Rationale:** REQ-003 requires configurable session expiry and the ability to invalidate sessions on logout or administrative action. Stateless IdP-issued JWTs cannot be revoked before expiry on their own, so a fast revocation/session store is needed. Redis holds active session metadata and a jti/session blocklist that the CRM API checks on every authenticated request, enabling immediate logout and admin-forced session termination.

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Requirements

### REQ-003: Session Management & Security
Category: non-functional | Status: in-progress
The system must manage authenticated sessions securely, including configurable session expiry, secure cookie handling, and the ability to invalidate sessions on logout or administrative action.

**Acceptance Criteria:**
- [ ] Sessions expire after a configurable idle timeout (default 30 minutes) and the user is redirected to the login page.
- [ ] Session tokens are stored in HTTP-only, Secure, SameSite=Strict cookies and are not accessible via JavaScript.
- [ ] Logging out immediately invalidates the server-side session so the token cannot be reused.

## Interface Contracts

### RECEIVES FROM: CRM API (backend-service)
- **Contract:** Session & Revocation Store
- **Protocol:** sql
- **Interaction:** data_write
- **Transport:** redis
- **Spec Format:** sql_ddl
- **Their Technology:** nodejs

**Inferred Payload (no schema defined -- implement based on this pattern):**
```
Data access pattern for "Session & Revocation Store" (nodejs):
  Query/mutation against CRM API using nodejs client SDK
```

## Technology Guidance

**Purpose:** Sub-millisecond in-memory data store serving as cache, session store, message broker, and real-time data engine. Use as a caching layer to reduce database load for frequently accessed data, for session management, rate limiting, real-time leaderboards, pub/sub messaging, and ephemeral data that benefits from extreme speed. Redis Streams add event sourcing capabilities. Use Redis as a complement alongside a persistent primary database, not as a replacement. Don't use as your sole database for data that must survive restarts without careful persistence configuration and backup strategies. Don't use for large datasets that exceed available memory -- Redis stores everything in RAM. Avoid for complex querying or relational operations. For a fully open-source drop-in alternative, consider Valkey.

**SDK Initialization:**
```
// Node.js with ioredis\nimport Redis from "ioredis";\nconst redis = new Redis(process.env.REDIS_URL!);\n// [Tailor to project language: Python=redis-py, Go=go-redis, Rust=fred, Java=Lettuce, .NET=StackExchange.Redis]
```

**Common API Patterns:**

#### Cache Pattern
Cache-aside pattern with TTL for any async data source
```
async function getCached<T>(key: string, fetcher: () => Promise<T>, ttl = 300): Promise<T> {\n  const cached = await redis.get(key);\n  if (cached) return JSON.parse(cached);\n  const data = await fetcher();\n  await redis.setex(key, ttl, JSON.stringify(data));\n  return data;\n}
```

#### Rate Limiter
Simple sliding window rate limiter
```
async function checkRateLimit(userId: string, limit: number, windowSec: number): Promise<boolean> {\n  const key = `ratelimit:${userId}`;\n  const count = await redis.incr(key);\n  if (count === 1) await redis.expire(key, windowSec);\n  return count <= limit;\n}
```

#### Session Store
Hash-based session storage with expiry
```
await redis.hset(`session:${sessionId}`, { userId, email, role, expiresAt: Date.now() + 3600000 });\nawait redis.expire(`session:${sessionId}`, 3600);\nconst session = await redis.hgetall(`session:${sessionId}`);
```

#### Pub/Sub
Pub/sub messaging for real-time notifications
```
const sub = new Redis(process.env.REDIS_URL!);\nsub.subscribe("notifications");\nsub.on("message", (channel, message) => {\n  console.log(`${channel}: ${message}`);\n});\nawait redis.publish("notifications", JSON.stringify({ userId, type: "alert" }));
```

**Configuration Template:**
```
# redis.conf key settings\nmaxmemory 256mb\nmaxmemory-policy allkeys-lru\nsave 900 1\nsave 300 10\nappendonly yes\nappendfsync everysec\nrequirepass ${REDIS_PASSWORD}\nbind 127.0.0.1\ntls-port 6380\ntls-cert-file /etc/redis/tls/redis.crt\ntls-key-file /etc/redis/tls/redis.key
```

**Best Practices:**
- Use appropriate data structures for each use case (strings, hashes, sets, sorted sets, streams)
- Set TTL on all cache keys to prevent unbounded memory growth
- Use pipelining for batch operations to reduce round-trip latency
- Enable persistence (RDB snapshots + AOF) when data durability matters
- Use Redis Cluster for horizontal scaling beyond single-node memory limits
- Monitor memory usage and configure maxmemory-policy for eviction behavior
- Use Lua scripting for atomic multi-step operations

**Anti-Patterns to Avoid:**
- Using as primary database without a persistent backing store for critical data
- Storing large objects (>1MB) as single keys consuming excessive memory
- Using KEYS command in production causing blocking scans (use SCAN instead)
- Ignoring memory limits leading to OOM kills or uncontrolled eviction
- Not setting TTL on cache entries causing memory to grow indefinitely
- Using Redis pub/sub for durable messaging (messages are lost if no subscriber is listening)

**Security:** Always set a strong password with requirepass. Enable TLS for all connections. Bind to specific interfaces, never 0.0.0.0 in production without firewall rules. Use ACLs (Redis 6+) to create users with minimal command and key permissions. Disable dangerous commands (FLUSHALL, KEYS, CONFIG) for application users. Place Redis in a private subnet accessible only to application servers.

**Integration Patterns:**
- Application cache layer between HTTP handlers and the primary database
- BullMQ or Celery for background job queues backed by Redis
- Redis Streams for lightweight event sourcing and log-based messaging
- Session store for web applications behind a load balancer

## Manual Setup Checklist

> The following steps require manual action by a human. AI cannot complete these steps automatically.

**Quick checklist:**
- [ ] Provision Redis Instance *(required)*
- [ ] Set Connection URL *(required)*

### Required Steps

#### [manual_workflow] Provision Redis Instance

Provision a Redis instance either locally (for development) or via a managed service (Redis Cloud, ElastiCache, Upstash) for production.

```bash
docker run -d -p 6379:6379 redis:latest
```

**Reference:** https://redis.io/docs/getting-started/

#### [environment_variable] Set Connection URL

Configure the Redis connection URL in your environment. For TLS connections, use the rediss:// protocol.

```bash
export REDIS_URL=redis://localhost:6379
```

## Connected Components

**Upstream (provides data to this component):**
- CRM API [nodejs] via sql ("Session & Revocation Store")

## Acceptance Criteria Implementation Map

### REQ-003: Session Management & Security
- Sessions expire after a configurable idle timeout (default 30 minutes) and the user is redirected to the login page.
  - **Satisfied by:** Contract "Session & Revocation Store" (sql) from CRM API [CROSS-NODE: requires CRM API]
- Session tokens are stored in HTTP-only, Secure, SameSite=Strict cookies and are not accessible via JavaScript.
  - **Satisfied by:** Contract "Session & Revocation Store" (sql) from CRM API [CROSS-NODE: requires CRM API]
- Logging out immediately invalidates the server-side session so the token cannot be reused.
  - **Satisfied by:** Contract "Session & Revocation Store" (sql) from CRM API [CROSS-NODE: requires CRM API]

## Dependency Chain

Startup/initialization order based on edge directions and interaction patterns.

**Depends on THIS node being available:**
- CRM API (reads from this node via Session & Revocation Store)

**Parent Container:** CRM Platform (application-module)
