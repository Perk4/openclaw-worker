# MEMORY.md — Long-Term Context

## Active Projects

### Satin Shield Content Engine
**Repo:** https://github.com/Perk4/satin-shield.git (branch: `deploy`)
**Dashboard:** https://satin-shield.pages.dev
**API:** https://satin-shield-content-engine.prtl.workers.dev

**What it is:** AI-powered content creation pipeline for Satin Shield brand (satin headphone covers that protect Black women's hair).

**Tech Stack:**
- Cloudflare Workers (API)
- Cloudflare R2 (storage)
- Cloudflare Pages (UI)
- Higgsfield Speak v2 (talking head videos)
- OpenAI TTS-1 (voiceover)
- Gemini (product images)
- Claude (script generation)
- Remotion (video composition — future)

**Current State (2026-02-07):**
- ✅ Phase 1: Higgsfield setup & validation
- ✅ Phase 2: Speak v2 implementation
- ✅ MVP Avatar UI deployed
- 🔲 Phase 2b: Characters (SoulId)
- 🔲 Phase 3: Multi-reference
- 🔲 Phase 4: Video composer (Remotion)

**Key API Endpoints:**
```
POST /api/higgsfield/speak     — Generate talking head
GET  /api/higgsfield/jobs      — List jobs
POST /api/content              — Generate script + TTS
POST /api/product-images       — Generate product images
```

**Model Limits:**
- Higgsfield Speak v2: 5/10/15 second max video
- OpenAI TTS-1: 4096 character max

**Credits:** ~760 remaining (Higgsfield)

---

## Quick References

### Higgsfield API
- Status endpoint: `/requests/{id}/status` (NO /v1 prefix!)
- Auth: `Authorization: Key {KEY_ID}:{KEY_SECRET}`
- User-Agent: `higgsfield-server-js/2.0`
- Audio must be WAV format

### SoulId (Character Consistency)
- Create: `POST /v1/custom-references`
- List: `GET /v1/custom-references/list`
- NOT usable directly with Speak v2 (only with Text2Image/Soul)

---

## Session Notes
- Daily notes: `/root/clawd/memory/YYYY-MM-DD.md`
- Detailed Higgsfield work: `memory/2026-02-07.md`

---

*Last updated: 2026-02-07*
