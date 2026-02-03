import type { Sandbox } from '@cloudflare/sandbox';
import type { PlaywrightMCP } from './mcp-object';

/**
 * Environment bindings for the Moltbot Worker
 */
export interface MoltbotEnv {
  Sandbox: DurableObjectNamespace<Sandbox>;
  ASSETS: Fetcher; // Assets binding for admin UI static files
  MOLTBOT_BUCKET: R2Bucket; // R2 bucket for persistent storage
  
  // Browser automation bindings
  BROWSER_KV?: KVNamespace; // KV for storing browser auth state
  AI?: Ai; // Workers AI for Stagehand
  MCP_OBJECT?: DurableObjectNamespace<PlaywrightMCP>; // Playwright MCP Durable Object
  // AI Gateway configuration (preferred)
  AI_GATEWAY_API_KEY?: string; // API key for the provider configured in AI Gateway
  AI_GATEWAY_BASE_URL?: string; // AI Gateway URL (e.g., https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/anthropic)
  // Legacy direct provider configuration (fallback)
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_OAUTH_TOKEN?: string;
  ANTHROPIC_BASE_URL?: string;
  OPENAI_API_KEY?: string;
  MOLTBOT_GATEWAY_TOKEN?: string; // Gateway token (mapped to OPENCLAW_GATEWAY_TOKEN for container)

  OPENCLAW_BIND_MODE?: string;
  DEV_MODE?: string; // Set to 'true' for local dev (skips CF Access auth + moltbot device pairing)
  E2E_TEST_MODE?: string; // Set to 'true' for E2E tests (skips CF Access auth but keeps device pairing)
  DEBUG_ROUTES?: string; // Set to 'true' to enable /debug/* routes
  SANDBOX_SLEEP_AFTER?: string; // How long before sandbox sleeps: 'never' (default), or duration like '10m', '1h'
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_DM_POLICY?: string;
  DISCORD_BOT_TOKEN?: string;
  DISCORD_DM_POLICY?: string;
  SLACK_BOT_TOKEN?: string;
  SLACK_APP_TOKEN?: string;
  // Cloudflare Access configuration for admin routes
  CF_ACCESS_TEAM_DOMAIN?: string; // e.g., 'myteam.cloudflareaccess.com'
  CF_ACCESS_AUD?: string; // Application Audience (AUD) tag
  // R2 credentials for bucket mounting (set via wrangler secret)
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string; // Override bucket name (default: 'openclaw-data')
  CF_ACCOUNT_ID?: string; // Cloudflare account ID for R2 endpoint
  // Browser Rendering binding for CDP shim
  BROWSER?: Fetcher;
  CDP_SECRET?: string; // Shared secret for CDP endpoint authentication
  WORKER_URL?: string; // Public URL of the worker (for CDP endpoint)
  
  // Cloudflare API access (for wrangler CLI in container)
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  
  // Git workspace sync (for identity files from GitHub)
  GITHUB_PAT?: string; // GitHub Personal Access Token
  GITHUB_REPO?: string; // Repo in format "owner/repo"
  
  // Skill-specific secrets (explicit, type-safe)
  AGENTMAIL_API_KEY?: string; // AgentMail API key for email skill
  GOG_KEYRING_PASSWORD?: string; // Keyring password for gog (Google Workspace) skill
  GOOGLE_API_KEY?: string; // Google API key for Gemini skill
  ELEVENLABS_API_KEY?: string; // ElevenLabs API key for TTS skill
  BRAVE_API_KEY?: string; // Brave Search API key
  
  // Dynamic skill secrets (no code changes needed)
  // Add secrets with these prefixes in Cloudflare dashboard:
  //   - SKILL_* (recommended for skill-specific secrets)
  //   - API_* (for third-party API keys)
  // They will be automatically forwarded to the container.
  // Example: SKILL_NOTION_API_KEY, API_AIRTABLE_TOKEN
  [key: `SKILL_${string}`]: string | undefined;
  [key: `API_${string}`]: string | undefined;
}

/**
 * Authenticated user from Cloudflare Access
 */
export interface AccessUser {
  email: string;
  name?: string;
}

/**
 * Hono app environment type
 */
export type AppEnv = {
  Bindings: MoltbotEnv;
  Variables: {
    sandbox: Sandbox;
    accessUser?: AccessUser;
  };
};

/**
 * JWT payload from Cloudflare Access
 */
export interface JWTPayload {
  aud: string[];
  email: string;
  exp: number;
  iat: number;
  iss: string;
  name?: string;
  sub: string;
  type: string;
}
