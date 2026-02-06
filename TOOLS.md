# TOOLS.md - Local Notes

## Cloudflare

### R2 Buckets
- `satin-shield-content` - Satin Shield video storage
  - Public URL: `https://pub-54ef14486e7149908708de84827b05ae.r2.dev`
  - Videos at: `/videos/*.mp4`

### Pages Projects
- `satin-shield` → https://satin-shield.pages.dev
  - Repo: `Perk4/satin-shield`
  - Root: `ui`
  - Auto-deploys on push

### Useful Commands
```bash
# Upload to R2
wrangler r2 object put "satin-shield-content/videos/file.mp4" --file "file.mp4" --content-type "video/mp4" --remote

# Enable R2 public access
wrangler r2 bucket dev-url enable <bucket-name>

# List R2 objects
wrangler r2 object list satin-shield-content --remote
```

---

## GitHub Repos

- `Perk4/satin-shield` - Satin Shield content engine (private)

---

## Email

- AgentMail: openclaw00@agentmail.to (for sending reports)
- Steven: steven.esp574@gmail.com

---

## Cron Jobs

- **10AM Satin Shield Report** - Daily status email with video count, pipeline health, blockers
