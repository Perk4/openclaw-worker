# TOOLS.md - Local Notes

## Git

- **Repo:** `Perk4/openclaw-worker` (GitHub)
- **Branch:** `main`
- **Commit policy:** Push on significant changes only (not heartbeats)

## Cloudflare

- **Account:** PRTL (`6a93f4e0f785a77f95436f494bb13fa3`)
- **API Token:** Available in env (`CLOUDFLARE_API_TOKEN`)
- **Worker:** `openclaw-worker` (Cloudchamber)
- **R2 Bucket:** `openclaw-data` — config backups (synced from `~/.openclaw/`)
- **Wrangler:** Reinstall after container restart: `npm i -g wrangler`

## Post-Restart Checklist

1. `npm i -g wrangler` (not persisted)
2. `apt-get install -y gh` (not persisted)  
3. Re-auth gh: `echo $GH_TOKEN | gh auth login --with-token`

## Not Yet Configured

- Cameras
- SSH hosts
- TTS voices
- Home automation
