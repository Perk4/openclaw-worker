# TOOLS.md - Local Notes

## Git

- **Repo:** `Perk4/openclaw-worker` (GitHub)
- **Auth:** PAT in remote URL + `gh` CLI logged in as Perk4
- **Branch:** `main`
- **Commit policy:** Push on significant changes only (not heartbeats). Significant = identity updates, new user info, important memories, config changes.

## Cloudflare

- **API Token:** Set in secrets (check env for `CLOUDFLARE_API_TOKEN`)
- **Deployment:** openclaw-worker (Cloudchamber)
- **Wrangler:** Check if available for deployments/KV/R2 access

## Not Yet Configured

- Cameras
- SSH hosts
- TTS voices
- Home automation
