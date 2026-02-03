# TOOLS.md - Local Notes

## File Ownership Split

| Owner | Files | Purpose |
|-------|-------|---------|
| **Git** | AGENTS.md, SOUL.md, IDENTITY.md, USER.md, TOOLS.md, HEARTBEAT.md, skills/ | Identity & config (version controlled) |
| **R2** | memory/*.md, ~/.openclaw/ (config, sessions, auth) | Runtime state (persisted across restarts) |

On startup: R2 restore → Git pull (identity files only) → Start gateway

## Git

- **Repo:** `Perk4/openclaw-worker`
- **Branch:** `main`  
- **Auth:** `GITHUB_PAT` env var (set in Cloudflare dashboard)
- **Commit policy:** Push significant changes only (not heartbeats)

## Cloudflare

- **Account:** PRTL (`6a93f4e0f785a77f95436f494bb13fa3`)
- **API Token:** `CLOUDFLARE_API_TOKEN` env var
- **Worker:** `openclaw-worker` (Cloudchamber)
- **R2 Bucket:** `openclaw-data`
- **Wrangler:** Reinstall after restart: `npm i -g wrangler`

## Post-Restart Checklist

Tools not in container image need reinstall:
```bash
npm i -g wrangler
apt-get update && apt-get install -y gh
echo "$GITHUB_PAT" | gh auth login --with-token
```

## Not Yet Configured

- Cameras, SSH hosts, TTS voices, Home automation
