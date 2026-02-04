import type { MoltbotEnv } from '../types';

/**
 * Prefixes for dynamic secret passthrough.
 * Secrets with these prefixes are automatically forwarded to the container
 * without requiring code changes. Add new secrets via Cloudflare dashboard
 * with one of these prefixes.
 * 
 * Examples:
 *   - SKILL_NOTION_API_KEY
 *   - SKILL_AIRTABLE_TOKEN
 *   - API_SOME_SERVICE_KEY
 */
const DYNAMIC_SECRET_PREFIXES = [
  'SKILL_',      // Generic skill secrets (recommended)
  'API_',        // Third-party API keys
];

/**
 * Suffixes for dynamic secret passthrough.
 * Secrets ending with these suffixes are automatically forwarded.
 * Catches common patterns like DISCORD_TOKEN, SOME_SERVICE_API_KEY, etc.
 * 
 * Examples:
 *   - DISCORD_TOKEN
 *   - DISCORD_BOT_TOKEN
 *   - LINEAR_API_KEY
 *   - NOTION_API
 */
const DYNAMIC_SECRET_SUFFIXES = [
  '_TOKEN',      // Auth tokens (DISCORD_TOKEN, SLACK_BOT_TOKEN, etc.)
  '_API_KEY',    // API keys (OPENAI_API_KEY, LINEAR_API_KEY, etc.)
  '_API',        // API identifiers (NOTION_API, etc.)
];

/**
 * Blocklist of environment variable patterns that should NEVER be forwarded,
 * even if they match a dynamic prefix. Security-sensitive system vars.
 */
const PASSTHROUGH_BLOCKLIST = [
  'CF_ACCESS_',
  'R2_SECRET_',
  'MOLTBOT_BUCKET',
  'BROWSER_KV',
];

/**
 * Check if a key matches any blocklist pattern
 */
function isBlocklisted(key: string): boolean {
  return PASSTHROUGH_BLOCKLIST.some(pattern => key.startsWith(pattern));
}

/**
 * Check if a key matches any dynamic passthrough prefix
 */
function hasDynamicPrefix(key: string): boolean {
  return DYNAMIC_SECRET_PREFIXES.some(prefix => key.startsWith(prefix));
}

/**
 * Check if a key matches any dynamic passthrough suffix
 */
function hasDynamicSuffix(key: string): boolean {
  return DYNAMIC_SECRET_SUFFIXES.some(suffix => key.endsWith(suffix));
}

/**
 * Check if a key should be dynamically passed through (prefix OR suffix match)
 */
function isDynamicSecret(key: string): boolean {
  return hasDynamicPrefix(key) || hasDynamicSuffix(key);
}

/**
 * Build environment variables to pass to the Moltbot container process
 * 
 * @param env - Worker environment bindings
 * @returns Environment variables record
 */
export function buildEnvVars(env: MoltbotEnv): Record<string, string> {
  const envVars: Record<string, string> = {};

  // Normalize the base URL by removing trailing slashes
  const normalizedBaseUrl = env.AI_GATEWAY_BASE_URL?.replace(/\/+$/, '');
  const isOpenAIGateway = normalizedBaseUrl?.endsWith('/openai');

  // If key in request (user provided ANTHROPIC_API_KEY) pass ANTHROPIC_API_KEY as is
  if (env.ANTHROPIC_API_KEY) {
    envVars.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  }
  if (env.ANTHROPIC_OAUTH_TOKEN) {
    envVars.ANTHROPIC_OAUTH_TOKEN = env.ANTHROPIC_OAUTH_TOKEN;
  }
  if (env.OPENAI_API_KEY) {
    envVars.OPENAI_API_KEY = env.OPENAI_API_KEY;
  }

  // AI Gateway will use auth token from either provider specific headers (x-api-key, Authorization) or cf-aig-authorization header
  // If the user wants to use AI Gateway (authenticated):
  // 1. If Anthropic/OpenAI key is not passed directly (stored with BYOK or if Unified Billing is used), pass AI_GATEWAY_API_KEY in vendor specific header
  // 2. If key is passed directly pass AI_GATEWAY_API_KEY in cf-aig-authorization header
  if (env.AI_GATEWAY_API_KEY) {
    if (isOpenAIGateway && !envVars.OPENAI_API_KEY) {
      envVars.OPENAI_API_KEY = env.AI_GATEWAY_API_KEY;
    } else if (!envVars.ANTHROPIC_API_KEY && !envVars.ANTHROPIC_OAUTH_TOKEN) {
      envVars.ANTHROPIC_API_KEY = env.AI_GATEWAY_API_KEY;
    } else {
      envVars.AI_GATEWAY_API_KEY = env.AI_GATEWAY_API_KEY;
    }
  }

  // Pass base URL (used by start-moltbot.sh to determine provider)
  if (normalizedBaseUrl) {
    envVars.AI_GATEWAY_BASE_URL = normalizedBaseUrl;
    // Also set the provider-specific base URL env var
    if (isOpenAIGateway) {
      envVars.OPENAI_BASE_URL = normalizedBaseUrl;
    } else {
      envVars.ANTHROPIC_BASE_URL = normalizedBaseUrl;
    }
  } else if (env.ANTHROPIC_BASE_URL) {
    envVars.ANTHROPIC_BASE_URL = env.ANTHROPIC_BASE_URL;
  }
  
  // Map Worker env vars to OPENCLAW_* for container
  if (env.MOLTBOT_GATEWAY_TOKEN) envVars.OPENCLAW_GATEWAY_TOKEN = env.MOLTBOT_GATEWAY_TOKEN;
  if (env.DEV_MODE) envVars.OPENCLAW_DEV_MODE = env.DEV_MODE;
  if (env.OPENCLAW_BIND_MODE) envVars.OPENCLAW_BIND_MODE = env.OPENCLAW_BIND_MODE;
  if (env.TELEGRAM_BOT_TOKEN) envVars.TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
  if (env.TELEGRAM_DM_POLICY) envVars.TELEGRAM_DM_POLICY = env.TELEGRAM_DM_POLICY;
  if (env.DISCORD_BOT_TOKEN) envVars.DISCORD_BOT_TOKEN = env.DISCORD_BOT_TOKEN;
  if (env.DISCORD_DM_POLICY) envVars.DISCORD_DM_POLICY = env.DISCORD_DM_POLICY;
  if (env.SLACK_BOT_TOKEN) envVars.SLACK_BOT_TOKEN = env.SLACK_BOT_TOKEN;
  if (env.SLACK_APP_TOKEN) envVars.SLACK_APP_TOKEN = env.SLACK_APP_TOKEN;
  if (env.CDP_SECRET) envVars.CDP_SECRET = env.CDP_SECRET;
  if (env.WORKER_URL) envVars.WORKER_URL = env.WORKER_URL;
  
  // Cloudflare API access (for wrangler CLI in container)
  if (env.CLOUDFLARE_API_TOKEN) envVars.CLOUDFLARE_API_TOKEN = env.CLOUDFLARE_API_TOKEN;
  if (env.CLOUDFLARE_ACCOUNT_ID) envVars.CLOUDFLARE_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
  if (env.CF_ACCOUNT_ID) envVars.CF_ACCOUNT_ID = env.CF_ACCOUNT_ID;
  
  // Git workspace sync (for identity files from GitHub)
  if (env.GITHUB_PAT) envVars.GITHUB_PAT = env.GITHUB_PAT;
  if (env.GITHUB_REPO) envVars.GITHUB_REPO = env.GITHUB_REPO;
  
  // Explicit skill-specific secrets (type-safe, for commonly used skills)
  if (env.AGENTMAIL_API_KEY) envVars.AGENTMAIL_API_KEY = env.AGENTMAIL_API_KEY;
  if (env.GOG_KEYRING_PASSWORD) envVars.GOG_KEYRING_PASSWORD = env.GOG_KEYRING_PASSWORD;
  if (env.GOOGLE_API_KEY) envVars.GOOGLE_API_KEY = env.GOOGLE_API_KEY;
  if (env.ELEVENLABS_API_KEY) envVars.ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;
  if (env.BRAVE_API_KEY) envVars.BRAVE_API_KEY = env.BRAVE_API_KEY;

  // Dynamic secret passthrough: forward any secret matching approved prefixes
  // This allows adding new skill secrets without code changes
  // Just add the secret in Cloudflare dashboard with SKILL_ or API_ prefix
  for (const [key, value] of Object.entries(env)) {
    // Skip if already set (explicit secrets take precedence)
    if (envVars[key]) continue;
    
    // Skip non-string values (bindings, objects, etc.)
    if (typeof value !== 'string') continue;
    
    // Skip blocklisted patterns
    if (isBlocklisted(key)) continue;
    
    // Forward if matches dynamic prefix
    if (isDynamicSecret(key)) {
      envVars[key] = value;
    }
  }

  return envVars;
}

// Export for testing
export { DYNAMIC_SECRET_PREFIXES, DYNAMIC_SECRET_SUFFIXES, PASSTHROUGH_BLOCKLIST, isDynamicSecret, isBlocklisted, hasDynamicPrefix, hasDynamicSuffix };
