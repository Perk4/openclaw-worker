/**
 * Browser Automation Routes
 * 
 * Modern browser automation using:
 * - @cloudflare/playwright for direct browser control
 * - Playwright MCP for LLM-driven browser automation
 * - Stagehand for AI-powered resilient automation
 * 
 * Authentication: CDP_SECRET query param (same as legacy CDP routes)
 */

import { Hono } from 'hono';
import { launch, connect, acquire, sessions, endpointURLString } from '@cloudflare/playwright';
import type { AppEnv, MoltbotEnv } from '../types';

const browser = new Hono<AppEnv>();

/**
 * Timing-safe string comparison to prevent timing attacks
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

// =============================================================================
// INFO ENDPOINTS
// =============================================================================

/**
 * GET /browser - Browser automation info
 */
browser.get('/', async (c) => {
  return c.json({
    name: 'OpenClaw Browser Automation',
    version: '2.0.0',
    endpoints: {
      '/browser/screenshot': 'POST - Take a screenshot (with optional auth state)',
      '/browser/content': 'POST - Get rendered HTML content',
      '/browser/sessions': 'GET - List active browser sessions',
      '/browser/storage': 'GET/PUT - Manage stored auth state',
      '/browser/stagehand': 'POST - AI-powered browser automation',
      '/mcp': 'Playwright MCP endpoint (Streamable HTTP)',
      '/sse': 'Playwright MCP endpoint (SSE transport)',
    },
    authentication: 'Pass ?secret=<CDP_SECRET> on all endpoints',
    features: [
      'Playwright-based automation (replaces CDP shim)',
      'Persistent auth state via KV',
      'Session reuse for performance',
      'AI-powered automation via Stagehand',
      'MCP integration for LLM control',
    ],
  });
});

// =============================================================================
// CORE BROWSER ENDPOINTS
// =============================================================================

/**
 * GET /browser/sessions - List active browser sessions
 */
browser.get('/sessions', async (c) => {
  const url = new URL(c.req.url);
  const auth = verifySecret(url, c.env);
  if (!auth.valid) {
    return c.json({ error: auth.error }, auth.error === 'Unauthorized' ? 401 : 503);
  }

  if (!c.env.BROWSER) {
    return c.json({ error: 'Browser Rendering not configured' }, 503);
  }

  try {
    const activeSessions = await sessions(c.env.BROWSER);
    return c.json({
      sessions: activeSessions,
      count: activeSessions.length,
    });
  } catch (error) {
    return c.json({ 
      error: 'Failed to list sessions',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /browser/screenshot - Capture a screenshot
 * 
 * Body: {
 *   url: string,
 *   viewport?: { width: number, height: number },
 *   fullPage?: boolean,
 *   waitUntil?: 'load' | 'domcontentloaded' | 'networkidle',
 *   useStoredAuth?: boolean,  // Load auth state from KV
 *   authKey?: string,         // KV key for auth state (default: 'default')
 * }
 */
browser.post('/screenshot', async (c) => {
  const reqUrl = new URL(c.req.url);
  const auth = verifySecret(reqUrl, c.env);
  if (!auth.valid) {
    return c.json({ error: auth.error }, auth.error === 'Unauthorized' ? 401 : 503);
  }

  if (!c.env.BROWSER) {
    return c.json({ error: 'Browser Rendering not configured' }, 503);
  }

  const body = await c.req.json<{
    url: string;
    viewport?: { width: number; height: number; deviceScaleFactor?: number };
    fullPage?: boolean;
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    useStoredAuth?: boolean;
    authKey?: string;
    timeout?: number;
  }>();

  if (!body.url) {
    return c.json({ error: 'url is required' }, 400);
  }

  try {
    // Load stored auth state if requested
    let storageState: object | undefined;
    if (body.useStoredAuth && c.env.BROWSER_KV) {
      const key = `auth-state:${body.authKey || 'default'}`;
      const stored = await c.env.BROWSER_KV.get(key, 'json');
      if (stored) {
        storageState = stored as object;
        console.log('[BROWSER] Loaded auth state from KV:', key);
      }
    }

    // Launch browser with extended keep-alive
    const browserInstance = await launch(c.env.BROWSER, { keep_alive: 60000 });
    
    // Create context with optional storage state
    const context = await browserInstance.newContext({
      storageState: storageState as Parameters<typeof browserInstance.newContext>[0]['storageState'],
      viewport: body.viewport || { width: 1280, height: 720 },
    });

    const page = await context.newPage();

    // Navigate
    await page.goto(body.url, {
      waitUntil: body.waitUntil || 'networkidle',
      timeout: body.timeout || 30000,
    });

    // Take screenshot
    const screenshot = await page.screenshot({
      fullPage: body.fullPage || false,
      type: 'png',
    });

    // Cleanup - disconnect to allow session reuse
    await browserInstance.close();

    return new Response(screenshot, {
      headers: {
        'Content-Type': 'image/png',
        'X-Browser-Session': 'playwright',
      },
    });
  } catch (error) {
    console.error('[BROWSER] Screenshot error:', error);
    return c.json({
      error: 'Screenshot failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /browser/content - Get rendered HTML content
 */
browser.post('/content', async (c) => {
  const reqUrl = new URL(c.req.url);
  const auth = verifySecret(reqUrl, c.env);
  if (!auth.valid) {
    return c.json({ error: auth.error }, auth.error === 'Unauthorized' ? 401 : 503);
  }

  if (!c.env.BROWSER) {
    return c.json({ error: 'Browser Rendering not configured' }, 503);
  }

  const body = await c.req.json<{
    url: string;
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    useStoredAuth?: boolean;
    authKey?: string;
    selector?: string;
    timeout?: number;
  }>();

  if (!body.url) {
    return c.json({ error: 'url is required' }, 400);
  }

  try {
    // Load stored auth state if requested
    let storageState: object | undefined;
    if (body.useStoredAuth && c.env.BROWSER_KV) {
      const key = `auth-state:${body.authKey || 'default'}`;
      const stored = await c.env.BROWSER_KV.get(key, 'json');
      if (stored) {
        storageState = stored as object;
      }
    }

    const browserInstance = await launch(c.env.BROWSER, { keep_alive: 60000 });
    const context = await browserInstance.newContext({
      storageState: storageState as Parameters<typeof browserInstance.newContext>[0]['storageState'],
    });
    const page = await context.newPage();

    await page.goto(body.url, {
      waitUntil: body.waitUntil || 'networkidle',
      timeout: body.timeout || 30000,
    });

    let content: string;
    if (body.selector) {
      const element = await page.$(body.selector);
      content = element ? await element.innerHTML() : '';
    } else {
      content = await page.content();
    }

    await browserInstance.close();

    return c.json({
      url: body.url,
      content,
      length: content.length,
    });
  } catch (error) {
    console.error('[BROWSER] Content error:', error);
    return c.json({
      error: 'Content extraction failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// =============================================================================
// AUTH STATE MANAGEMENT
// =============================================================================

/**
 * GET /browser/storage - List stored auth states
 */
browser.get('/storage', async (c) => {
  const url = new URL(c.req.url);
  const auth = verifySecret(url, c.env);
  if (!auth.valid) {
    return c.json({ error: auth.error }, auth.error === 'Unauthorized' ? 401 : 503);
  }

  if (!c.env.BROWSER_KV) {
    return c.json({ error: 'KV storage not configured' }, 503);
  }

  try {
    const list = await c.env.BROWSER_KV.list({ prefix: 'auth-state:' });
    return c.json({
      keys: list.keys.map(k => ({
        name: k.name.replace('auth-state:', ''),
        metadata: k.metadata,
      })),
    });
  } catch (error) {
    return c.json({
      error: 'Failed to list storage',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /browser/storage/:key - Get a specific auth state
 */
browser.get('/storage/:key', async (c) => {
  const url = new URL(c.req.url);
  const auth = verifySecret(url, c.env);
  if (!auth.valid) {
    return c.json({ error: auth.error }, auth.error === 'Unauthorized' ? 401 : 503);
  }

  if (!c.env.BROWSER_KV) {
    return c.json({ error: 'KV storage not configured' }, 503);
  }

  const key = c.req.param('key');
  const stored = await c.env.BROWSER_KV.get(`auth-state:${key}`, 'json');

  if (!stored) {
    return c.json({ error: 'Auth state not found' }, 404);
  }

  return c.json({
    key,
    state: stored,
  });
});

/**
 * PUT /browser/storage/:key - Store auth state (from browser session)
 */
browser.put('/storage/:key', async (c) => {
  const url = new URL(c.req.url);
  const auth = verifySecret(url, c.env);
  if (!auth.valid) {
    return c.json({ error: auth.error }, auth.error === 'Unauthorized' ? 401 : 503);
  }

  if (!c.env.BROWSER_KV) {
    return c.json({ error: 'KV storage not configured' }, 503);
  }

  const key = c.req.param('key');
  const body = await c.req.json();

  await c.env.BROWSER_KV.put(`auth-state:${key}`, JSON.stringify(body), {
    metadata: { updatedAt: new Date().toISOString() },
  });

  return c.json({
    success: true,
    key,
    message: 'Auth state stored',
  });
});

/**
 * DELETE /browser/storage/:key - Delete stored auth state
 */
browser.delete('/storage/:key', async (c) => {
  const url = new URL(c.req.url);
  const auth = verifySecret(url, c.env);
  if (!auth.valid) {
    return c.json({ error: auth.error }, auth.error === 'Unauthorized' ? 401 : 503);
  }

  if (!c.env.BROWSER_KV) {
    return c.json({ error: 'KV storage not configured' }, 503);
  }

  const key = c.req.param('key');
  await c.env.BROWSER_KV.delete(`auth-state:${key}`);

  return c.json({
    success: true,
    key,
    message: 'Auth state deleted',
  });
});

// =============================================================================
// STAGEHAND - AI-POWERED AUTOMATION
// =============================================================================

/**
 * POST /browser/stagehand - Execute AI-powered browser automation
 * 
 * Body: {
 *   url: string,
 *   actions: string[],  // Natural language actions to perform
 *   extract?: {         // Optional data extraction
 *     instruction: string,
 *     schema: object,   // Zod-compatible schema
 *   },
 *   useStoredAuth?: boolean,
 *   authKey?: string,
 *   saveAuth?: boolean, // Save auth state after actions
 * }
 */
browser.post('/stagehand', async (c) => {
  const url = new URL(c.req.url);
  const auth = verifySecret(url, c.env);
  if (!auth.valid) {
    return c.json({ error: auth.error }, auth.error === 'Unauthorized' ? 401 : 503);
  }

  if (!c.env.BROWSER) {
    return c.json({ error: 'Browser Rendering not configured' }, 503);
  }

  if (!c.env.AI) {
    return c.json({ 
      error: 'Workers AI not configured',
      hint: 'Add AI binding to wrangler.jsonc: "ai": { "binding": "AI" }',
    }, 503);
  }

  const body = await c.req.json<{
    url: string;
    actions: string[];
    extract?: {
      instruction: string;
      schema: Record<string, unknown>;
    };
    useStoredAuth?: boolean;
    authKey?: string;
    saveAuth?: boolean;
    screenshot?: boolean;
  }>();

  if (!body.url) {
    return c.json({ error: 'url is required' }, 400);
  }

  if (!body.actions || body.actions.length === 0) {
    return c.json({ error: 'actions array is required' }, 400);
  }

  try {
    // Dynamic import of Stagehand (to avoid issues if not installed)
    const { Stagehand } = await import('@browserbasehq/stagehand');
    const { WorkersAIClient } = await import('../lib/workers-ai-client');

    // Load stored auth state if requested
    let storageState: object | undefined;
    if (body.useStoredAuth && c.env.BROWSER_KV) {
      const key = `auth-state:${body.authKey || 'default'}`;
      const stored = await c.env.BROWSER_KV.get(key, 'json');
      if (stored) {
        storageState = stored as object;
        console.log('[STAGEHAND] Loaded auth state from KV:', key);
      }
    }

    // Initialize Stagehand
    const stagehand = new Stagehand({
      env: 'LOCAL',
      localBrowserLaunchOptions: { 
        cdpUrl: endpointURLString(c.env.BROWSER),
      },
      llmClient: new WorkersAIClient(c.env.AI),
      verbose: 1,
    });

    await stagehand.init();
    const page = stagehand.page;

    // Apply storage state if available
    if (storageState) {
      // Navigate to a page on the domain first to set cookies
      const urlObj = new URL(body.url);
      await page.goto(`${urlObj.protocol}//${urlObj.host}`);
      
      // Apply cookies from storage state
      const state = storageState as { cookies?: Array<{ name: string; value: string; domain: string; path: string }> };
      if (state.cookies) {
        await page.context().addCookies(state.cookies);
      }
    }

    // Navigate to target URL
    await page.goto(body.url);

    // Execute each action
    const actionResults: Array<{ action: string; success: boolean; error?: string }> = [];
    
    for (const action of body.actions) {
      try {
        console.log('[STAGEHAND] Executing action:', action);
        
        // Observe what actions are needed
        const observedActions = await page.observe(action);
        
        // Execute each observed action
        for (const observedAction of observedActions) {
          await page.act(observedAction);
        }
        
        actionResults.push({ action, success: true });
      } catch (error) {
        console.error('[STAGEHAND] Action failed:', action, error);
        actionResults.push({ 
          action, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Extract data if requested
    let extractedData: unknown = null;
    if (body.extract) {
      try {
        const { z } = await import('zod');
        // Convert schema object to Zod schema (simplified)
        const schema = z.object(body.extract.schema as Record<string, z.ZodTypeAny>);
        extractedData = await page.extract({
          instruction: body.extract.instruction,
          schema,
        });
      } catch (error) {
        console.error('[STAGEHAND] Extraction failed:', error);
      }
    }

    // Take screenshot if requested
    let screenshot: string | null = null;
    if (body.screenshot) {
      const screenshotBuffer = await page.screenshot();
      screenshot = Buffer.from(screenshotBuffer).toString('base64');
    }

    // Save auth state if requested
    if (body.saveAuth && c.env.BROWSER_KV) {
      const key = `auth-state:${body.authKey || 'default'}`;
      const newState = await page.context().storageState();
      await c.env.BROWSER_KV.put(key, JSON.stringify(newState), {
        metadata: { updatedAt: new Date().toISOString() },
      });
      console.log('[STAGEHAND] Saved auth state to KV:', key);
    }

    await stagehand.close();

    return c.json({
      success: true,
      url: body.url,
      actions: actionResults,
      extracted: extractedData,
      screenshot,
    });
  } catch (error) {
    console.error('[STAGEHAND] Error:', error);
    return c.json({
      error: 'Stagehand automation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /browser/login - Convenience endpoint for login flows
 * 
 * Uses Stagehand to perform login and saves auth state
 */
browser.post('/login', async (c) => {
  const url = new URL(c.req.url);
  const auth = verifySecret(url, c.env);
  if (!auth.valid) {
    return c.json({ error: auth.error }, auth.error === 'Unauthorized' ? 401 : 503);
  }

  if (!c.env.BROWSER || !c.env.AI) {
    return c.json({ 
      error: 'Browser and AI bindings required for login',
    }, 503);
  }

  const body = await c.req.json<{
    loginUrl: string;
    credentials: {
      username?: string;
      email?: string;
      password: string;
    };
    authKey?: string;
    successIndicator?: string; // CSS selector or text to verify login success
  }>();

  if (!body.loginUrl || !body.credentials?.password) {
    return c.json({ error: 'loginUrl and credentials.password are required' }, 400);
  }

  try {
    const { Stagehand } = await import('@browserbasehq/stagehand');
    const { WorkersAIClient } = await import('../lib/workers-ai-client');

    const stagehand = new Stagehand({
      env: 'LOCAL',
      localBrowserLaunchOptions: { 
        cdpUrl: endpointURLString(c.env.BROWSER),
      },
      llmClient: new WorkersAIClient(c.env.AI),
      verbose: 1,
    });

    await stagehand.init();
    const page = stagehand.page;

    // Navigate to login page
    await page.goto(body.loginUrl);

    // Build login actions based on provided credentials
    const actions: string[] = [];
    
    if (body.credentials.email) {
      actions.push(`Enter "${body.credentials.email}" in the email field`);
    } else if (body.credentials.username) {
      actions.push(`Enter "${body.credentials.username}" in the username field`);
    }
    
    actions.push(`Enter "${body.credentials.password}" in the password field`);
    actions.push('Click the login or sign in button');

    // Execute login actions
    for (const action of actions) {
      const observedActions = await page.observe(action);
      for (const observedAction of observedActions) {
        await page.act(observedAction);
      }
    }

    // Wait for navigation/login to complete
    await page.waitForLoadState('networkidle');

    // Verify login success if indicator provided
    let loginSuccess = true;
    if (body.successIndicator) {
      try {
        await page.waitForSelector(body.successIndicator, { timeout: 5000 });
      } catch {
        loginSuccess = false;
      }
    }

    // Save auth state
    if (loginSuccess && c.env.BROWSER_KV) {
      const key = `auth-state:${body.authKey || 'default'}`;
      const state = await page.context().storageState();
      await c.env.BROWSER_KV.put(key, JSON.stringify(state), {
        metadata: { 
          updatedAt: new Date().toISOString(),
          domain: new URL(body.loginUrl).host,
        },
      });
    }

    // Take a screenshot for verification
    const screenshot = await page.screenshot();

    await stagehand.close();

    return new Response(screenshot, {
      headers: {
        'Content-Type': 'image/png',
        'X-Login-Success': String(loginSuccess),
        'X-Auth-Key': body.authKey || 'default',
      },
    });
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    return c.json({
      error: 'Login failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export { browser };
