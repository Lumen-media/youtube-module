# YouTube Module

A [Lumen](https://github.com/Lumen-media/lumen) module for searching YouTube videos directly from the Commander. Search, preview, and add videos to your queue, library, or play them without leaving the app.

<img width="776" height="504" alt="image" src="https://github.com/user-attachments/assets/f7b3ee47-bb12-453b-93db-912af881e3e8" />

## Search Sources

The module supports two search backends and can switch between them automatically:

| Source | API Key Required | Quota | Best For |
|--------|------------------|-------|----------|
| **Google YouTube API** | Yes | ~100 searches/day | Precise regional/language filtering, official results |
| **Invidious (public instances)** | No | Unlimited | No key needed, fallback when quota exceeded |

**Default mode: `Automatic`** — Uses Google API if a key is configured; transparently falls back to Invidious when quota is exhausted or if no key is set. You can force a specific source in Settings.

## Getting a YouTube API Key (Optional)

An API key enables the Google backend with better regional filtering (`regionCode`, `relevanceLanguage`). Without a key, the module works out of the box via Invidious.

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**:
   - Go to **APIs & Services > Library**
   - Search for "YouTube Data API v3"
   - Click **Enable**
4. Create an API key:
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > API Key**
   - Copy the generated key

## Configuration

1. Open the YouTube module in the Commander (`YouTube: Search`)
2. Click the gear icon (⚙) in the top-right corner
3. Adjust preferences:
   - **Search Source** — `Automatic` (default) / `Google API only` / `Invidious only`
   - **Region Code** (e.g., `BR`) — Google API only
   - **Language** (e.g., `pt`) — Google API only
   - **Safe Search** (None / Moderate / Strict)
   - **Max Results** (10 / 25 / 50)
   - **Default Action** (Add to Queue / Play Now)
4. (Optional) Paste your Google API key and/or a backup key for redundancy

## Usage

### Commander App

Open via command palette: `YouTube: Search`

- Type to search for videos
- Press `↑` / `↓` to navigate results
- `Enter` to play the selected video
- Keyboard shortcuts on a selected result:

| Key | Action |
|-----|--------|
| `Enter` | Play now |
| `Q` | Add to queue (end) |
| `N` | Add as next |
| `L` | Add to library |
| `O` | Open on YouTube |
| `Y` | Copy URL |

### Quick Prefix

Type `youtube <query>` or `yt <query>` directly in the command palette to search YouTube without opening the module first.

| Prefix | Example | Result |
|--------|---------|--------|
| `youtube` | `youtube hillsong oceans` | Searches for "hillsong oceans" |
| `yt` | `yt tudo posso` | Searches for "tudo posso" |

### URL Paste

Paste a YouTube URL (`youtube.com/watch`, `youtu.be`, `shorts`, `embed`) into the search field to instantly resolve and add the video.

## States

| State | Behavior |
|-------|----------|
| No API key (Automatic mode) | Works via Invidious; key is optional |
| No API key (Google-only mode) | Shows CTA to configure in settings |
| Invalid key | Shows error with shortcut to edit key |
| Quota exceeded (Auto mode) | Transparent fallback to Invidious |
| Quota exceeded (Google-only mode) | Shows warning, cached results remain available |
| Offline / Network error | Shows retry button |

## Architecture

```
src/
├── main.tsx                  # Plugin entry — registers commands, prefixes, menu
├── youtube-api.ts            # Unified search (Google + Invidious with auto-fallback)
├── invidious-api.ts          # Invidious client with instance failover
├── youtube-types.ts          # Shared types (responses, preferences, errors)
├── youtube-url.ts            # URL parsing / generation helpers
├── i18n.ts                   # Translation setup
├── data/preferences.ts       # Persistent preferences store
├── hooks/useYoutubeSearch.ts # React Query wrapper for search
├── components/
│   ├── YoutubeCommanderApp   # Root Commander app (search + settings views)
│   ├── ResultList            # Virtualized results list
│   ├── ResultRow             # Single result row with thumbnail + metadata
│   ├── SettingsView          # API key + preferences + source selector
│   └── YoutubeLogoIcon       # YouTube SVG icon
└── i18n/
    ├── en.ts                 # English (default)
    └── pt-BR.ts              # Brazilian Portuguese
```

## Internationalization

The module uses a custom lightweight i18n system. To add a new locale:

1. Create `src/i18n/<locale>.ts` exporting a `Record<string, string>` with all keys from `en.ts`
2. Import it in `src/i18n.ts` and add it to the `_translations` map

The active locale is automatically set from `host.app.locale` on load.

## Develop

```bash
pnpm install
pnpm dev          # watch mode — rebuilds on file changes
pnpm build        # bundles into dist/
pnpm pack         # creates {id}-{version}.lumenpack in dist/
pnpm validate     # schema-checks manifest.json
pnpm lint         # biome check — lint & format src/
pnpm format       # biome format — format src/
```

## Publish

1. Create a GitHub release on this repo with tag `vX.Y.Z` and attach the `.lumenpack` as a release asset.
2. Open a PR against [Lumen-media/community-modules](https://github.com/Lumen-media/community-modules) adding an entry to `modules.json` that points at this repo.

> The `.github/workflows/release.yml` workflow automates version bumping, building, packing, and creating the release — just trigger it from the Actions tab.

## License

MIT

---

Powered by [Invidious API](https://docs.invidious.io/api/) — uses public Invidious instances for keyless, unlimited YouTube search.
