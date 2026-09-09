# YouTube for Lumen

Search YouTube without ever leaving [Lumen](https://github.com/Lumen-media/lumen). Find the video, preview it, and send it to your queue, your library, or straight to the screen — all from the command palette.

<img width="776" height="504" alt="YouTube search in the Commander" src="https://github.com/user-attachments/assets/f7b3ee47-bb12-453b-93db-912af881e3e8" />

## What it does for you

- **Instant search** — Type a query in the Commander and get results fast, no browser needed.
- **Play it your way** — Play now, add to the end of the queue, add as next, or save to the library with a single keystroke.
- **No setup required** — Works out of the box; an optional Google API key unlocks tighter regional and language filtering.
- **Smart fallback** — Automatically switches between the Google API and keyless Invidious sources when quota runs out.
- **Paste-and-go** — Drop a `youtube.com`, `youtu.be`, `shorts`, or `embed` link into the search box to resolve it instantly.
- **Your screen, your language** — Safe search, result counts, region and language preferences all in Settings.

## Quick start

1. Install the module in Lumen (**Settings → Modules → Install Module**) and select the `.lumenpack` from the latest release.
2. Open the command palette (`Ctrl+Shift+P`) and run `YouTube: Search`.
3. Type to search. Select a result, then:

| Key | Action |
|---|---|
| `Enter` | Play now |
| `Q` | Add to queue (end) |
| `N` | Add as next |
| `L` | Add to library |
| `O` | Open on YouTube |
| `Y` | Copy URL |

## Even faster

Type `youtube <query>` or `yt <query>` directly in the command palette to skip the module entirely:

| Prefix | Example |
|---|---|
| `youtube` | `youtube hillsong oceans` |
| `yt` | `yt tudo posso` |

## Power users

- Paste a YouTube URL into the search field to resolve it instantly.
- In **Settings** (gear icon), choose the search source, region, language, safe search, and default action.
- Add a Google API key for precise results and regional filtering — optional, the module works without it.

---

Made for the [Lumen](https://github.com/Lumen-media/lumen) platform. MIT licensed — see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for technical details.

Powered by [Invidious API](https://docs.invidious.io/api/) — uses public Invidious instances for keyless, unlimited YouTube search.