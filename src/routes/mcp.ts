/**
 * Playwright MCP Routes
 * 
 * Exposes Playwright browser automation via Model Context Protocol (MCP).
 * This allows LLMs like Claude to directly control the browser.
 * 
 * Endpoints:
 * - /mcp - Streamable HTTP transport
 * - /sse - Server-Sent Events transport
 */

import { Hono } from 'hono';
import type { AppEnv, MoltbotEnv } from '../types';

const mcp = new Hono<AppEnv>();

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verify CDP secret from query param
 */
function verifySecret(url: URL, env: MoltbotEnv): { valid: boolean; error?: string } {
  const providedSecret = url.searchParams.get('secret');
  const expectedSecret = env.CDP_SECRET;

  if (!expectedSecret) {
    return { valid: false, error: 'CDP_SECRET not configured' };
  }

  if (!providedSecret || !timingSafeEqual(providedSecret, expectedSecret)) {
    return { valid: false, error: 'Unauthorized' };
  }

  return { valid: true };
}

/**
 * GET /mcp - MCP info endpoint
 */
mcp.get('/', async (c) => {
  return c.json({
    name: 'OpenClaw Playwright MCP',
    version: '1.0.0',
    description: 'Browser automation via Model Context Protocol',
    transports: {
      streamableHttp: '/mcp',
      sse: '/sse',
    },
    authentication: 'Pass ?secret=<CDP_SECRET> on connect',
    capabilities: [
      'browser_navigate',
      'browser_screenshot', 
      'browser_click',
      'browser_type',
      'browser_snapshot',
      'browser_evaluate',
    ],
    docs: 'https://developers.cloudflare.com/browser-rendering/playwright/playwright-mcp/',
  });
});

/**
 * MCP endpoint handler factory
 * 
 * Creates the Playwright MCP agent and routes requests to it.
 * Uses Durable Objects to maintain browser session state.
 */
async function createMcpHandler(c: any, transport: 'http' | 'sse') {
  const url = new URL(c.req.url);
  const auth = verifySecret(url, c.env);
  
  if (!auth.valid) {
    return c.json({ error: auth.error }, auth.error === 'Unauthorized' ? 401 : 503);
  }

  if (!c.env.BROWSER) {
    return c.json({ error: 'Browser Rendering not configured' }, 503);
  }

  if (!c.env.MCP_OBJECT) {
    return c.json({ 
      error: 'MCP Durable Object not configured',
      hint: 'Add MCP_OBJECT binding to wrangler.jsonc',
    }, 503);
  }

  try {
    // Get or create the MCP Durable Object instance
    const id = c.env.MCP_OBJECT.idFromName('playwright-mcp');
    const stub = c.env.MCP_OBJECT.get(id);
    
    // Forward the request to the Durable Object
    const doRequest = new Request(c.req.url, {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.method !== 'GET' ? c.req.raw.body : undefined,
    });
    
    return stub.fetch(doRequest);
  } catch (error) {
    console.error('[MCP] Error:', error);
    return c.json({
      error: 'MCP handler failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
}

/**
 * POST /mcp - Streamable HTTP MCP transport
 */
mcp.post('/', async (c) => {
  return createMcpHandler(c, 'http');
});

/**
 * GET /sse - SSE MCP transport connection
 */
mcp.get('/sse', async (c) => {
  return createMcpHandler(c, 'sse');
});

/**
 * POST /sse/message - SSE MCP message endpoint
 */
mcp.post('/sse/message', async (c) => {
  return createMcpHandler(c, 'sse');
});

export { mcp };
