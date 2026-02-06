# MEMORY.md - Long-Term Memory

## My Identity
- **Name:** Portal (or P)
- Steven named me this — it's been said multiple times, WRITE IT DOWN
- If IDENTITY.md is blank again, something went wrong with persistence

---

## Steven (User)
- Working on **Satin Shield** - a product/brand with AI-powered content generation
- Uses Cloudflare ecosystem (Pages, R2, Workers)
- GitHub: `Perk4`
- Email: steven.esp574@gmail.com

---

## Projects

### Satin Shield Content Engine
AI-powered video content generation pipeline for UGC-style marketing videos.

**Live URLs:**
- UI Dashboard: https://satin-shield.pages.dev
- R2 Public: https://pub-54ef14486e7149908708de84827b05ae.r2.dev

**Repo:** `Perk4/satin-shield` (GitHub, private)

**Architecture:**
- `/ui/` - Vite + React + TypeScript dashboard (deployed to Cloudflare Pages)
- `/demo/` - Remotion project (video rendering engine)
- `/demo/worker/` - Cloudflare Worker (API, not yet deployed)
- `/demo/src/compositions/` - 4 video templates

**Cloudflare Resources:**
- **Pages project:** satin-shield (auto-deploys from repo)
- **R2 bucket:** `satin-shield-content`
  - Videos stored at: `videos/*.mp4`
  - Public access enabled via r2.dev

**Video Templates:**
1. TalkingHead - UGC-style talking head
2. ProductShowcase - Product demo format
3. EducationalExplainer - Educational content
4. TrendResponse - Quick trend response videos

**Pipeline Status (as of 2026-02-06):**
- ✅ Remotion rendering with Chrome headless
- ✅ Claude API script generation (authentic UGC voice)
- ✅ Animated captions, brand watermark, AI disclosure
- ✅ UI gallery deployed to Pages
- ✅ Videos hosted on R2
- ⏳ Hedra/D-ID avatar integration (needs API key)
- ⏳ Audio/voiceover integration
- ⏳ Worker API deployment
- ⏳ Dashboard controls (trigger renders, job status)

**Pages Deploy Config:**
- Root directory: `ui`
- Build command: `npm install && npm run build`
- Output directory: `dist`

**10AM Daily Report:**
- Cron job sends daily status email to steven.esp574@gmail.com
- Summarizes videos rendered, pipeline status, blockers

---

## Lessons Learned

- Cloudflare API token needs explicit Pages permissions for wrangler pages deploy
- When creating Pages via dashboard: click "Pages" tab (not Workers) to get the right flow
- R2 public access: `wrangler r2 bucket dev-url enable <bucket>`
