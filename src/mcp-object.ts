/**
 * Playwright MCP Durable Object
 * 
 * Maintains browser session state and handles MCP protocol messages.
 * Uses @cloudflare/playwright-mcp for the actual MCP implementation.
 */

import { DurableObject } from 'cloudflare:workers';
import type { MoltbotEnv } from './types';

/**
 * PlaywrightMCP Durable Object
 * 
 * Wraps @cloudflare/playwright-mcp's createMcpAgent to provide
 * persistent browser sessions across MCP requests.
 */
export class PlaywrightMCP extends DurableObject<MoltbotEnv> {
  private mcpAgent: ReturnType<typeof import('@cloudflare/playwright-mcp').createMcpAgent> | null = null;

  constructor(state: DurableObjectState, env: MoltbotEnv) {
    super(state, env);
  }

  /**
   * Initialize the MCP agent lazily
   */
  private async getAgent() {
    if (!this.mcpAgent) {
      const { createMcpAgent } = await import('@cloudflare/playwright-mcp');
      this.mcpAgent = createMcpAgent(this.env.BROWSER!);
    }
    return this.mcpAgent;
  }

  /**
   * Handle incoming fetch requests
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    console.log('[PlaywrightMCP] Handling request:', pathname);

    try {
      const agent = await this.getAgent();

      // Route to appropriate MCP transport handler
      if (pathname.endsWith('/sse') || pathname.endsWith('/sse/message')) {
        // SSE transport
        const sseHandler = agent.serveSSE('/sse');
        return sseHandler.fetch(request, this.env, this.ctx);
      } else {
        // Streamable HTTP transport (default)
        const httpHandler = agent.serve('/mcp');
        return httpHandler.fetch(request, this.env, this.ctx);
      }
    } catch (error) {
      console.error('[PlaywrightMCP] Error:', error);
      return new Response(JSON.stringify({
        error: 'MCP agent error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}
