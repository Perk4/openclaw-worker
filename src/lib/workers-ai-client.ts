/**
 * Workers AI Client for Stagehand
 * 
 * Adapts Cloudflare Workers AI binding to Stagehand's LLM client interface.
 * Based on: https://github.com/cloudflare/playwright/blob/main/packages/playwright-cloudflare/examples/stagehand/src/worker/workersAIClient.ts
 */

import type { 
  LLMClient, 
  ChatMessage,
  AvailableModel,
  LLMResponse,
  CreateChatCompletionOptions,
} from '@browserbasehq/stagehand';

interface AIGatewayOptions {
  id: string;
  skipCache?: boolean;
  cacheTtl?: number;
}

interface WorkersAIClientOptions {
  gateway?: AIGatewayOptions;
}

/**
 * WorkersAIClient implements Stagehand's LLMClient interface using Cloudflare Workers AI
 */
export class WorkersAIClient implements LLMClient {
  private ai: Ai;
  private gateway?: AIGatewayOptions;
  public type = 'workers-ai' as const;

  constructor(ai: Ai, options?: WorkersAIClientOptions) {
    this.ai = ai;
    this.gateway = options?.gateway;
  }

  /**
   * Create a chat completion using Workers AI
   */
  async createChatCompletion(
    options: CreateChatCompletionOptions
  ): Promise<LLMResponse> {
    const { 
      messages, 
      temperature = 0.7, 
      maxTokens = 2048,
      // Note: Workers AI doesn't support all OpenAI-style options
    } = options;

    // Map messages to Workers AI format
    const aiMessages = messages.map((msg: ChatMessage) => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: typeof msg.content === 'string' 
        ? msg.content 
        : JSON.stringify(msg.content),
    }));

    // Use llama model for Stagehand (good balance of speed and capability)
    const model = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

    try {
      const response = await this.ai.run(model, {
        messages: aiMessages,
        max_tokens: maxTokens,
        temperature,
        // Add gateway options if configured
        ...(this.gateway && {
          gateway: this.gateway,
        }),
      }) as { response?: string };

      // Extract the response text
      const responseText = response.response || '';

      return {
        id: crypto.randomUUID(),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: responseText,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 0, // Workers AI doesn't always return token counts
          completion_tokens: 0,
          total_tokens: 0,
        },
      };
    } catch (error) {
      console.error('[WorkersAIClient] Error:', error);
      throw error;
    }
  }
}

/**
 * Type declaration for Cloudflare AI binding
 */
declare global {
  interface Ai {
    run(
      model: string,
      input: {
        messages: Array<{ role: string; content: string }>;
        max_tokens?: number;
        temperature?: number;
        gateway?: AIGatewayOptions;
      }
    ): Promise<{ response?: string }>;
  }
}
