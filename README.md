# YouTube Module

A [Lumen](https://github.com/Lumen-media/lumen) module for searching YouTube videos directly from the Commander. Search, preview, and add videos to your queue, library, or play them without leaving the app.

![screenshot-placeholder-main]()

## Getting a YouTube API Key

This module requires a **YouTube Data API v3 key** to function. The key belongs to you — it is not provided by Lumen or the module.

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

![screenshot-placeholder-google-console]()

## Configuration

1. Open the YouTube module in the Commander (`YouTube: Search`)
2. Click the gear icon (⚙) in the top-right corner
3. Paste your API key and adjust preferences:
   - **Region Code** (e.g., `BR`)
   - **Language** (e.g., `pt`)
   - **Safe Search** (None / Moderate / Strict)
   - **Max Results** (10 / 25 / 50)
   - **Default Action** (Add to Queue / Play Now)

![screenshot-placeholder-settings]()

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

Type `youtube <query>` or `yt <query>` in the command palette to search directly.

### URL Paste

Paste a YouTube URL (`youtube.com/watch`, `youtu.be`, `shorts`, `embed`) into the search field to instantly resolve and add the video.

## States

| State | Behavior |
|-------|----------|
| No API key | Shows CTA to configure in settings |
| Invalid key | Shows error with shortcut to edit key |
| Quota exceeded | Shows warning, cached results remain available |
| Offline / Network error | Shows retry button |

## Develop

```bash
pnpm install
pnpm build        # bundles into dist/
pnpm pack         # creates {id}-{version}.lumenpack in dist/
pnpm validate     # schema-checks manifest.json
```

## Publish

1. Create a GitHub release on this repo with tag `vX.Y.Z` and attach the `.lumenpack` as a release asset.
2. Open a PR against [Lumen-media/community-modules](https://github.com/Lumen-media/community-modules) adding an entry to `modules.json` that points at this repo.

## License

MIT
