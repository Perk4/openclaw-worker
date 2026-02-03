import { describe, it, expect } from 'vitest';
import { buildEnvVars, isDynamicSecret, isBlocklisted, DYNAMIC_SECRET_PREFIXES, PASSTHROUGH_BLOCKLIST } from './env';
import { createMockEnv } from '../test-utils';

describe('buildEnvVars', () => {
  it('returns empty object when no env vars set', () => {
    const env = createMockEnv();
    const result = buildEnvVars(env);
    expect(result).toEqual({});
  });

  it('includes ANTHROPIC_API_KEY when set directly', () => {
    const env = createMockEnv({ ANTHROPIC_API_KEY: 'sk-test-key' });
    const result = buildEnvVars(env);
    expect(result.ANTHROPIC_API_KEY).toBe('sk-test-key');
  });

  it('maps AI_GATEWAY_API_KEY to ANTHROPIC_API_KEY for Anthropic gateway', () => {
    const env = createMockEnv({
      AI_GATEWAY_API_KEY: 'sk-gateway-key',
      AI_GATEWAY_BASE_URL: 'https://gateway.ai.cloudflare.com/v1/123/my-gw/anthropic',
    });
    const result = buildEnvVars(env);
    expect(result.ANTHROPIC_API_KEY).toBe('sk-gateway-key');
    expect(result.ANTHROPIC_BASE_URL).toBe('https://gateway.ai.cloudflare.com/v1/123/my-gw/anthropic');
    expect(result.OPENAI_API_KEY).toBeUndefined();
  });

  it('maps AI_GATEWAY_API_KEY to OPENAI_API_KEY for OpenAI gateway', () => {
    const env = createMockEnv({
      AI_GATEWAY_API_KEY: 'sk-gateway-key',
      AI_GATEWAY_BASE_URL: 'https://gateway.ai.cloudflare.com/v1/123/my-gw/openai',
    });
    const result = buildEnvVars(env);
    expect(result.OPENAI_API_KEY).toBe('sk-gateway-key');
    expect(result.OPENAI_BASE_URL).toBe('https://gateway.ai.cloudflare.com/v1/123/my-gw/openai');
    expect(result.ANTHROPIC_API_KEY).toBeUndefined();
  });

  it('passes AI_GATEWAY_BASE_URL directly', () => {
    const env = createMockEnv({
      AI_GATEWAY_BASE_URL: 'https://gateway.ai.cloudflare.com/v1/123/my-gw/anthropic',
    });
    const result = buildEnvVars(env);
    expect(result.AI_GATEWAY_BASE_URL).toBe('https://gateway.ai.cloudflare.com/v1/123/my-gw/anthropic');
  });

  it('falls back to ANTHROPIC_* when AI_GATEWAY_* not set', () => {
    const env = createMockEnv({
      ANTHROPIC_API_KEY: 'direct-key',
      ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
    });
    const result = buildEnvVars(env);
    expect(result.ANTHROPIC_API_KEY).toBe('direct-key');
    expect(result.ANTHROPIC_BASE_URL).toBe('https://api.anthropic.com');
  });

  it('includes OPENAI_API_KEY when set directly (no gateway)', () => {
    const env = createMockEnv({ OPENAI_API_KEY: 'sk-openai-key' });
    const result = buildEnvVars(env);
    expect(result.OPENAI_API_KEY).toBe('sk-openai-key');
  });

  it('maps MOLTBOT_GATEWAY_TOKEN to OPENCLAW_GATEWAY_TOKEN for container', () => {
    const env = createMockEnv({ MOLTBOT_GATEWAY_TOKEN: 'my-token' });
    const result = buildEnvVars(env);
    expect(result.OPENCLAW_GATEWAY_TOKEN).toBe('my-token');
  });

  it('includes all channel tokens when set', () => {
    const env = createMockEnv({
      TELEGRAM_BOT_TOKEN: 'tg-token',
      TELEGRAM_DM_POLICY: 'pairing',
      DISCORD_BOT_TOKEN: 'discord-token',
      DISCORD_DM_POLICY: 'open',
      SLACK_BOT_TOKEN: 'slack-bot',
      SLACK_APP_TOKEN: 'slack-app',
    });
    const result = buildEnvVars(env);
    
    expect(result.TELEGRAM_BOT_TOKEN).toBe('tg-token');
    expect(result.TELEGRAM_DM_POLICY).toBe('pairing');
    expect(result.DISCORD_BOT_TOKEN).toBe('discord-token');
    expect(result.DISCORD_DM_POLICY).toBe('open');
    expect(result.SLACK_BOT_TOKEN).toBe('slack-bot');
    expect(result.SLACK_APP_TOKEN).toBe('slack-app');
  });

  it('maps DEV_MODE to OPENCLAW_DEV_MODE for container', () => {
    const env = createMockEnv({
      DEV_MODE: 'true',
      OPENCLAW_BIND_MODE: 'lan',
    });
    const result = buildEnvVars(env);

    expect(result.OPENCLAW_DEV_MODE).toBe('true');
    expect(result.OPENCLAW_BIND_MODE).toBe('lan');
  });

  it('combines all env vars correctly', () => {
    const env = createMockEnv({
      ANTHROPIC_API_KEY: 'sk-key',
      MOLTBOT_GATEWAY_TOKEN: 'token',
      TELEGRAM_BOT_TOKEN: 'tg',
    });
    const result = buildEnvVars(env);
    
    expect(result).toEqual({
      ANTHROPIC_API_KEY: 'sk-key',
      OPENCLAW_GATEWAY_TOKEN: 'token',
      TELEGRAM_BOT_TOKEN: 'tg',
    });
  });

  it('handles trailing slash in AI_GATEWAY_BASE_URL for OpenAI', () => {
    const env = createMockEnv({
      AI_GATEWAY_API_KEY: 'sk-gateway-key',
      AI_GATEWAY_BASE_URL: 'https://gateway.ai.cloudflare.com/v1/123/my-gw/openai/',
    });
    const result = buildEnvVars(env);
    expect(result.OPENAI_API_KEY).toBe('sk-gateway-key');
    expect(result.OPENAI_BASE_URL).toBe('https://gateway.ai.cloudflare.com/v1/123/my-gw/openai');
    expect(result.AI_GATEWAY_BASE_URL).toBe('https://gateway.ai.cloudflare.com/v1/123/my-gw/openai');
    expect(result.ANTHROPIC_API_KEY).toBeUndefined();
  });

  it('handles trailing slash in AI_GATEWAY_BASE_URL for Anthropic', () => {
    const env = createMockEnv({
      AI_GATEWAY_API_KEY: 'sk-gateway-key',
      AI_GATEWAY_BASE_URL: 'https://gateway.ai.cloudflare.com/v1/123/my-gw/anthropic/',
    });
    const result = buildEnvVars(env);
    expect(result.ANTHROPIC_API_KEY).toBe('sk-gateway-key');
    expect(result.ANTHROPIC_BASE_URL).toBe('https://gateway.ai.cloudflare.com/v1/123/my-gw/anthropic');
    expect(result.AI_GATEWAY_BASE_URL).toBe('https://gateway.ai.cloudflare.com/v1/123/my-gw/anthropic');
    expect(result.OPENAI_API_KEY).toBeUndefined();
  });

  it('handles multiple trailing slashes in AI_GATEWAY_BASE_URL', () => {
    const env = createMockEnv({
      AI_GATEWAY_API_KEY: 'sk-gateway-key',
      AI_GATEWAY_BASE_URL: 'https://gateway.ai.cloudflare.com/v1/123/my-gw/openai///',
    });
    const result = buildEnvVars(env);
    expect(result.OPENAI_API_KEY).toBe('sk-gateway-key');
    expect(result.OPENAI_BASE_URL).toBe('https://gateway.ai.cloudflare.com/v1/123/my-gw/openai');
    expect(result.AI_GATEWAY_BASE_URL).toBe('https://gateway.ai.cloudflare.com/v1/123/my-gw/openai');
  });

  // Dynamic secret passthrough tests
  describe('dynamic secret passthrough', () => {
    it('forwards SKILL_ prefixed secrets', () => {
      const env = createMockEnv({
        SKILL_NOTION_API_KEY: 'notion-secret',
        SKILL_AIRTABLE_TOKEN: 'airtable-secret',
      });
      const result = buildEnvVars(env);
      expect(result.SKILL_NOTION_API_KEY).toBe('notion-secret');
      expect(result.SKILL_AIRTABLE_TOKEN).toBe('airtable-secret');
    });

    it('forwards API_ prefixed secrets', () => {
      const env = createMockEnv({
        API_SOME_SERVICE: 'service-key',
        API_ANOTHER_KEY: 'another-key',
      });
      const result = buildEnvVars(env);
      expect(result.API_SOME_SERVICE).toBe('service-key');
      expect(result.API_ANOTHER_KEY).toBe('another-key');
    });

    it('does not forward non-prefixed secrets', () => {
      const env = createMockEnv({
        RANDOM_SECRET: 'should-not-pass',
        MY_API_KEY: 'also-no',
      });
      const result = buildEnvVars(env);
      expect(result.RANDOM_SECRET).toBeUndefined();
      expect(result.MY_API_KEY).toBeUndefined();
    });

    it('does not forward blocklisted secrets even with valid prefix', () => {
      const env = createMockEnv({
        CF_ACCESS_TOKEN: 'blocked',
        R2_SECRET_KEY: 'also-blocked',
      });
      const result = buildEnvVars(env);
      expect(result.CF_ACCESS_TOKEN).toBeUndefined();
      expect(result.R2_SECRET_KEY).toBeUndefined();
    });

    it('explicit secrets take precedence over dynamic', () => {
      const env = createMockEnv({
        AGENTMAIL_API_KEY: 'explicit-key',
      });
      const result = buildEnvVars(env);
      expect(result.AGENTMAIL_API_KEY).toBe('explicit-key');
    });

    it('does not forward non-string values', () => {
      const env = createMockEnv({});
      // Add a non-string value that might exist in env
      (env as Record<string, unknown>).SKILL_OBJECT = { foo: 'bar' };
      const result = buildEnvVars(env);
      expect(result.SKILL_OBJECT).toBeUndefined();
    });
  });

  describe('isDynamicSecret', () => {
    it('returns true for SKILL_ prefix', () => {
      expect(isDynamicSecret('SKILL_TEST')).toBe(true);
      expect(isDynamicSecret('SKILL_')).toBe(true);
    });

    it('returns true for API_ prefix', () => {
      expect(isDynamicSecret('API_TEST')).toBe(true);
      expect(isDynamicSecret('API_')).toBe(true);
    });

    it('returns false for non-matching prefixes', () => {
      expect(isDynamicSecret('RANDOM_KEY')).toBe(false);
      expect(isDynamicSecret('skill_lowercase')).toBe(false);
      expect(isDynamicSecret('MYSKILL_KEY')).toBe(false);
    });
  });

  describe('isBlocklisted', () => {
    it('returns true for blocklisted patterns', () => {
      expect(isBlocklisted('CF_ACCESS_TOKEN')).toBe(true);
      expect(isBlocklisted('CF_ACCESS_AUD')).toBe(true);
      expect(isBlocklisted('R2_SECRET_ACCESS_KEY')).toBe(true);
    });

    it('returns false for non-blocklisted keys', () => {
      expect(isBlocklisted('SKILL_TEST')).toBe(false);
      expect(isBlocklisted('API_KEY')).toBe(false);
      expect(isBlocklisted('ANTHROPIC_API_KEY')).toBe(false);
    });
  });

  describe('constants', () => {
    it('has expected dynamic prefixes', () => {
      expect(DYNAMIC_SECRET_PREFIXES).toContain('SKILL_');
      expect(DYNAMIC_SECRET_PREFIXES).toContain('API_');
    });

    it('has expected blocklist patterns', () => {
      expect(PASSTHROUGH_BLOCKLIST).toContain('CF_ACCESS_');
      expect(PASSTHROUGH_BLOCKLIST).toContain('R2_SECRET_');
    });
  });
});
