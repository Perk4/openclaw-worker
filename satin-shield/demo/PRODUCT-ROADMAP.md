# Satin Shield Content Engine - Product Roadmap

> **Vision**: A unified content creation pipeline where Scripts → Products → Avatars → Videos flow seamlessly together
> **Created**: 2026-02-07

---

## 🎯 The Big Picture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CONTENT CREATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   📝 SCRIPTS          📸 PRODUCTS         🎭 AVATAR          📺 VIDEO   │
│   ┌─────────┐        ┌─────────┐        ┌─────────┐        ┌─────────┐ │
│   │ Write   │───────▶│ Generate│───────▶│ Create  │───────▶│ Compose │ │
│   │ Script  │        │ Images  │        │ Talking │        │ Final   │ │
│   │ + TTS   │        │         │        │ Head    │        │ Video   │ │
│   └─────────┘        └─────────┘        └─────────┘        └─────────┘ │
│        │                  │                  │                  │       │
│        ▼                  ▼                  ▼                  ▼       │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                      📚 LIBRARY                                  │  │
│   │   Scripts + Audio    Product Images    Avatar Videos    Finals   │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Tab Purpose & Integration

### 📝 Scripts Tab
**Purpose**: Generate scripts + voiceovers for any video type
**Outputs**: Script text + MP3/WAV audio files
**Integration**:
- Audio → Avatar tab (for lip-sync)
- Script → Beat sheet (future: multi-scene)
- Stored in Library for reuse

### 📸 Products Tab
**Purpose**: Generate consistent product images from spec
**Outputs**: Product images (PNG)
**Integration**:
- Images → Avatar tab (as product reference)
- Images → Video compositor (overlays, B-roll)
- Stored in Library

### 🎭 Avatar Tab
**Purpose**: Create talking head videos
**Inputs**: Portrait + Audio (from Scripts or uploaded)
**Outputs**: Lip-synced video (MP4)
**Integration**:
- Uses audio from Scripts tab
- Uses product/environment refs for future multi-ref
- Videos → Remotion for compositing
- Stored in Library

### 📚 Library Tab
**Purpose**: Central asset repository
**Contains**: All generated assets organized by type
**Actions**:
- Browse, search, filter
- Re-use in other tabs
- Delete, archive
- Export/download

### 📺 Videos Tab (Future: Remotion Compositor)
**Purpose**: Combine assets into final videos
**Inputs**: Avatar clips + Product images + Audio + Captions
**Outputs**: Final composed video with:
- Multiple scenes
- Product overlays
- Animated captions
- Transitions

---

## 🚀 Implementation Phases

### Phase 1: MVP Avatar UI (NOW)
**Goal**: Simple, working Speak v2 integration

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎭 Avatar Studio (MVP)                          [Higgsfield ⚡] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐                                          │
│  │  Portrait Image  │   Tips:                                  │
│  │    (required)    │   • Clear face, good lighting            │
│  │       👤         │   • Front-facing preferred               │
│  └──────────────────┘                                          │
│                                                                 │
│  Script Source:                                                 │
│  ○ Write new script    ○ Use from Library ▼                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Hey girl! You know how headphones destroy your edges?   │   │
│  │ I found these satin covers and my hair has never...     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Voice: [🎤 Nova ▼]                                            │
│                                                                 │
│  Expression: [😊 Friendly & Warm ▼]                            │
│    ├─ 😊 Friendly & Warm                                       │
│    ├─ 💼 Professional                                          │
│    ├─ 🎉 Excited & Energetic                                   │
│    ├─ 😌 Calm & Soothing                                       │
│    └─ ✏️ Custom...                                             │
│                                                                 │
│  [🎬 Generate Video] (~2-5 min • ~25 credits)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation checklist**:
- [ ] Single portrait image upload
- [ ] Script textarea OR library selector
- [ ] Voice dropdown (OpenAI voices)
- [ ] Expression preset dropdown
- [ ] Generate button with credit estimate
- [ ] Job status + video preview
- [ ] Save to Library

---

### Phase 2: Character Consistency (SoulId)
**Goal**: Create persistent brand characters

```
┌─────────────────────────────────────────────────────────────────┐
│ 👥 Characters                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Your Characters:                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                           │
│  │ Keisha  │ │ Maya    │ │+ Create │                           │
│  │ [photo] │ │ [photo] │ │   New   │                           │
│  │ ✓ Ready │ │ ✓ Ready │ │         │                           │
│  └─────────┘ └─────────┘ └─────────┘                           │
│                                                                 │
│  Create New Character:                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Name: [Satin Shield Ambassador___________]               │  │
│  │                                                          │  │
│  │ Reference Photos (3-5 recommended):                      │  │
│  │ [📸 +] [📸 +] [📸 +] [📸 +] [📸 +]                       │  │
│  │                                                          │  │
│  │ [Create Character] (~30s • ~10 credits)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Workflow**:
1. Upload 3-5 photos of same person (different angles/expressions)
2. Create SoulId → Higgsfield processes
3. Generate consistent portraits with Text2Image/Soul
4. Use generated portraits in Avatar tab

---

### Phase 3: Multi-Reference Generation
**Goal**: Character + Product + Environment in one shot

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎭 Avatar Studio (Multi-Ref)                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Mode: ○ Simple   ● Advanced                                   │
│                                                                 │
│  References:                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 👤 Character    │ 📦 Product      │ 🏠 Environment     │   │
│  │ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────┐    │   │
│  │ │   Keisha    │ │ │ Satin Cover │ │ │ Studio      │    │   │
│  │ │   [photo]   │ │ │   [photo]   │ │ │   [photo]   │    │   │
│  │ │  ▼ Select   │ │ │  ▼ Select   │ │ │  ▼ Select   │    │   │
│  │ └─────────────┘ │ └─────────────┘ │ └─────────────┘    │   │
│  │ From Characters │ From Products  │ Upload/Generate     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Scene: "Keisha holds up the satin cover, showing the          │
│          texture in her modern apartment"                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Workflow**:
1. Select character (from Characters tab / SoulId)
2. Select product (from Products tab)
3. Select environment (upload or generate)
4. Generate composite image with all refs
5. Use composite with Speak v2

---

### Phase 4: Multi-Scene Videos (Remotion)
**Goal**: Script → Beat sheet → Multi-scene video

```
┌─────────────────────────────────────────────────────────────────┐
│ 📺 Video Composer                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Project: "Satin Shield Product Demo"                           │
│                                                                 │
│  Beat Sheet:                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Scene │ Type        │ Duration │ Asset          │ Status│   │
│  ├───────┼─────────────┼──────────┼────────────────┼───────┤   │
│  │ 1     │ Talking Head│ 5s       │ keisha_intro   │ ✅    │   │
│  │ 2     │ Product Shot│ 3s       │ cover_closeup  │ ✅    │   │
│  │ 3     │ Talking Head│ 8s       │ keisha_demo    │ 🔄    │   │
│  │ 4     │ B-Roll      │ 4s       │ lifestyle_shot │ ⬜    │   │
│  │ 5     │ Talking Head│ 5s       │ keisha_cta     │ ⬜    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Timeline:                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Scene1][Scene2][  Scene3  ][Sc4][Scene5]               │   │
│  │ 0s     5s      8s         16s   20s     25s             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [▶ Preview] [Generate Missing] [Export Final]                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Beat Sheet Structure**:
```typescript
interface BeatSheet {
  scenes: Scene[];
  totalDuration: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
}

interface Scene {
  id: string;
  order: number;
  type: 'talking-head' | 'product-shot' | 'b-roll' | 'text-overlay';
  duration: number;
  script?: string;        // For talking head scenes
  assetId?: string;       // Reference to generated asset
  transition?: 'cut' | 'fade' | 'slide';
  caption?: string;       // Overlay text
}
```

---

## 🔄 Data Flow Between Tabs

```
┌──────────────┐
│   Scripts    │
│   Tab        │
└──────┬───────┘
       │ script + audio
       ▼
┌──────────────┐     ┌──────────────┐
│   Avatar     │◀────│   Products   │
│   Tab        │     │   Tab        │
└──────┬───────┘     └──────┬───────┘
       │ video              │ images
       ▼                    ▼
┌─────────────────────────────────────┐
│              Library                 │
│   [scripts] [products] [avatars]    │
└──────────────────┬──────────────────┘
                   │ all assets
                   ▼
            ┌──────────────┐
            │   Videos     │
            │   (Remotion) │
            └──────────────┘
```

---

## 📊 Expression Presets for Higgsfield

Based on what works well with Speak v2:

```typescript
const EXPRESSION_PRESETS = [
  {
    id: 'friendly',
    label: 'Friendly & Warm',
    emoji: '😊',
    prompt: 'speaking naturally with warm, friendly expression, slight smile, engaging eye contact, approachable demeanor'
  },
  {
    id: 'professional',
    label: 'Professional',
    emoji: '💼',
    prompt: 'speaking confidently with professional demeanor, clear articulation, poised posture, authoritative but approachable'
  },
  {
    id: 'excited',
    label: 'Excited & Energetic',
    emoji: '🎉',
    prompt: 'speaking enthusiastically with bright expression, animated gestures, high energy, genuine excitement'
  },
  {
    id: 'calm',
    label: 'Calm & Soothing',
    emoji: '😌',
    prompt: 'speaking softly with relaxed expression, gentle tone, reassuring presence, measured pace'
  },
  {
    id: 'informative',
    label: 'Educational',
    emoji: '📚',
    prompt: 'speaking thoughtfully with focused expression, clear explanations, occasional hand gestures to emphasize points'
  },
  {
    id: 'custom',
    label: 'Custom...',
    emoji: '✏️',
    prompt: ''  // User provides
  }
];
```

---

## ✅ MVP Implementation Checklist

### UI Changes
- [ ] Simplify Avatar tab to single image input
- [ ] Add "Script Source" toggle (write new / use from library)
- [ ] Add expression preset dropdown
- [ ] Add credit cost estimate display
- [ ] Update job status UI for Higgsfield
- [ ] Remove Hedra warning banner
- [ ] Update footer to show "Higgsfield"

### API Integration
- [x] POST /api/higgsfield/speak - Generate video
- [x] GET /api/higgsfield/speak/:jobId - Job status
- [x] GET /api/higgsfield/jobs - List jobs
- [ ] Link to existing scripts from Library

### Library Integration
- [ ] Add "Use in Avatar" action on script items
- [ ] Show Higgsfield videos in Library
- [ ] Filter by asset type

---

## 🗓️ Timeline Estimate

| Phase | Scope | Effort |
|-------|-------|--------|
| **Phase 1: MVP** | Simple Avatar UI | 1-2 days |
| **Phase 2: Characters** | SoulId integration | 2-3 days |
| **Phase 3: Multi-Ref** | Advanced generation | 3-4 days |
| **Phase 4: Composer** | Remotion beat sheet | 5-7 days |

---

*Last updated: 2026-02-07*
