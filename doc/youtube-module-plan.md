# YouTube Module Plan

## Goal

Create a Lumen module focused on discovering YouTube videos inside the Commander and sending those videos to Lumen's native flow: preview, queue, library, and playback. The module should use the public Lumen SDK whenever possible and leave any privileged, native, or sensitive work to the host APIs.

The first version should not try to be a full YouTube clone. It should solve the Lumen use case well: quickly find a video during preparation/presentation and put it in the right place without leaving the app.

## Initial Decisions

- The main UI will be a Commander app registered with `host.commands.add({ type: "app" })`.
- Also worth registering a `youtube <query>` prefix for quick search directly in the palette.
- Search can use YouTube Data API v3 in the module via `host.net`, as long as the key is configured by the user.
- The API key must not be embedded in the module bundle.
- By default, each client/installation provides their own Google API key after installing the module.
- The main screen needs a settings gear to edit API key and preferences without leaving the Commander flow.
- The module should persist simple preferences with `host.data.json` and structured history/cache with `host.data.sqlite` if needed.
- Initial playback should be via YouTube URL using the already planned/implemented Lumen APIs: `host.library.addUrl` and `host.queue.addUrl`.
- Video/audio download is not part of the module MVP.
- If download comes later, it should live in the Lumen host, likely in Rust/Tauri, exposed via an SDK API. The module would only call that API.

## Why Download Stays Out of MVP

The official YouTube API Services policy states that clients must not download, import, back up, cache, or store copies of YouTube audiovisual content without prior YouTube approval. It also prohibits separating/isolating audio or video components and using technologies outside YouTube's APIs to retrieve audiovisual content.

Implications for Lumen:

- `yt-dlp`, scraping, stream extraction, and direct download must not be public module foundations.
- The safe path is to play via embeddable player/URL and let Lumen store only permitted metadata and thumbnails according to the existing architecture.
- A future download feature needs explicit scope: own/authorized content, approval, or another legally permitted source. This feature should be implemented in the host, not the module.

Official sources consulted:

- YouTube Data API `search.list`: https://developers.google.com/youtube/v3/docs/search/list
- YouTube Data API `videos.list`: https://developers.google.com/youtube/v3/docs/videos/list
- YouTube API Services Developer Policies: https://developers.google.com/youtube/terms/developer-policies

## User Experience

### Commander App

Main command:

- `YouTube: Search`
- Opens a screen inside the Commander.
- Search field at the top.
- Result list with thumbnail, title, channel, duration, date, and live/upcoming indicators when available.
- Actions per result:
  - Play/preview now
  - Add to queue
  - Add next
  - Add to library
  - Open on YouTube
  - Copy URL

### Quick Prefix

Prefix:

- `youtube oceans hillsong`
- `yt oceans hillsong` as alias, if the SDK allows it or if we register two prefixes.

Behavior:

- Without query: show recent history results or suggestion to configure API key.
- With query: return compact results directly in the palette.
- Enter on a result should add to queue or open a details screen, to be decided.
- Shift/secondary action could become `Add next` when the UI supports richer shortcuts.

### Settings

Since `host.settings` doesn't persist fully yet, use `host.data.json` for now.

Fields:

- `apiKey`: user's YouTube Data API v3 key.
- `regionCode`: default `BR` or empty for global behavior.
- `relevanceLanguage`: default from app locale when it makes sense.
- `safeSearch`: `moderate` by default.
- `defaultAction`: `addToQueue` or `details`.
- `maxResults`: 10, 25, or 50.

The screen must have clear states for missing key, exceeded quota, offline network, and API permission errors.

### Settings UI

Settings should be accessible via a gear icon visible in the top-right corner of the YouTube Commander app. The gear opens an internal settings view/panel owned by the module, without depending on the Lumen global settings screen initially.

Gear/config requirements:

- Appear on the search screen and in error/missing-key states.
- Open a `SettingsView` with API key field, search preferences, and save/cancel actions.
- Allow testing the key with a lightweight call before saving, if quota permits.
- Show the key masked after saving, with an explicit reveal/edit action.
- Explain that the key belongs to the client/user and is not provided by Lumen or the module.
- Persist in MVP with `host.data.json`; migrate to `host.secrets` when Lumen has that service.

Expected states:

- No key: show empty screen with CTA to open settings.
- Invalid key: show error and shortcut to edit settings.
- Quota exceeded: show warning and keep history/cache available.
- Offline/network failure: show recoverable error with retry.

## Module Architecture

Suggested structure:

```txt
src/
  main.tsx
  youtube-api.ts
  youtube-types.ts
  youtube-url.ts
  components/
    YoutubeCommanderApp.tsx
    SearchBox.tsx
    ResultList.tsx
    ResultRow.tsx
    SettingsView.tsx
  data/
    preferences.ts
    recent-searches.ts
```

### `main.tsx`

Responsibilities:

- Initialize i18n.
- Load preferences.
- Register `youtube-module.search` app command.
- Register `youtube` prefix.
- Register optional menu under `Modules > YouTube`.

### `youtube-api.ts`

Responsibilities:

- Call `search.list` with `part=snippet`, `type=video`, `q`, `maxResults`, `regionCode`, `relevanceLanguage`, `safeSearch`, and `pageToken`.
- Use `videos.list` to enrich results with `contentDetails`, `statistics`, and maybe `status`.
- Normalize response into a simple internal model.
- Handle quota, invalid key, network, and incomplete response errors.

Suggested internal model:

```ts
type YoutubeVideoResult = {
  videoId: string
  url: string
  title: string
  channelTitle: string
  channelId?: string
  description?: string
  thumbnailUrl?: string
  publishedAt?: string
  durationIso?: string
  durationSeconds?: number
  viewCount?: number
  liveBroadcastContent?: "none" | "live" | "upcoming"
}
```

### `youtube-url.ts`

Responsibilities:

- Generate canonical URL `https://www.youtube.com/watch?v=<videoId>`.
- Accept URL pasting instead of text search.
- Extract video id from `youtube.com/watch`, `youtu.be`, `shorts`, and `embed`.

### Local Persistence

`host.data.json`:

- Preferences and API key.

`host.data.sqlite` (optional):

- Search history.
- Recently cached results for a few days.
- Recently added videos to avoid visual duplicates.

Do not store video/audio copies. Cache only metadata needed for UX, respecting API policies.

## Lumen Integration

### Existing/Planned APIs

Use when available:

```ts
await host.queue.addUrl?.({
  url: "https://www.youtube.com/watch?v=VIDEO_ID",
  position: "end",
})

await host.queue.addUrl?.({
  url: "https://www.youtube.com/watch?v=VIDEO_ID",
  position: "next",
})

await host.library.addUrl?.({
  type: "video",
  url: "https://www.youtube.com/watch?v=VIDEO_ID",
  addToQueue: true,
})
```

If the installed SDK version doesn't type these APIs yet, use a temporary cast and register the definitive addition in the SDK plan.

### Request via Lumen Host

The module should not depend on `fetch()` directly in the renderer as its main contract. The SDK should expose a generic `host.net.request()` API, implemented by Lumen in Rust/Tauri, so the module can make a request and receive a normalized response.

Desired flow:

```txt
YouTube module
  -> host.net.request({ url, method, query, headers, body })
  -> Tauri command
  -> Rust validates module network permission
  -> Rust executes HTTP request
  -> SDK returns status, headers, and data
```

Search usage example:

```ts
const search = await host.net.get<YoutubeSearchResponse>(
  "https://www.googleapis.com/youtube/v3/search",
  {
    query: {
      part: "snippet",
      type: "video",
      q,
      key: apiKey,
      maxResults: 10,
      safeSearch: "moderate",
    },
  }
)
```

The module manifest should declare network permission only for required hosts:

```json
{
  "permissions": {
    "network": [
      "https://www.googleapis.com/youtube/v3/*"
    ]
  }
}
```

Detailed architecture is in the Lumen repo at `docs/architecture/module-net-request-api.md`.

Important: in the current state, `host.net` exists in Lumen's internal host but is not yet exposed in the public `@lumen-media/module-sdk`. Before the module depends on this, the SDK needs to receive `NetAPI` and Lumen needs to implement the Rust/Tauri bridge.

Mandatory task before module implementation: update the `Lumen-media/module-sdk` repo with `NetAPI`/`NetRequest`/`NetResponse` types, add `net` to `LumenHost`, add `permissions.network` to the manifest schema, and publish/consume a new SDK version.

### APIs That May Need to Be Created in Lumen

For a complete experience, the host may need to expose:

```ts
host.youtube.search?(input): Promise<YoutubeSearchPage>
host.youtube.getVideo?(videoId): Promise<YoutubeVideoDetails>
host.media.previewUrl?(url): Promise<void>
host.library.addUrl?(input): Promise<LibraryItem>
host.queue.addUrl?(input): Promise<void>
```

The initial credential decision is:

1. The module does not ship its own key and does not use developer keys by default.
2. Each client/user configures their own Google API key after installing the module.
3. MVP saves the key with `host.data.json`, with clear configuration UI.
4. When `host.secrets` exists, migrate the key to secure Lumen storage.
5. The `youtube-api.ts` layer should be isolated to allow swapping `host.net` for `host.youtube.search` in the future, if Lumen gains a specific service.

## Phase Plan

### Phase 0 - Align Contract

- Confirm focus is search for presentation/worship/event, not general consumption.
- Confirm default Enter action: add to queue, add next, or open details.
- Confirm whether playlists are in the first cycle or left for later.
- Update SDK/app if `host.queue.addUrl` and `host.library.addUrl` are still partial.

### Phase 1 - Functional MVP

- Commander app screen with manual search.
- API key configuration via gear inside the Commander app.
- `search.list` + `videos.list` calls.
- Result rendering with thumbnail and key metadata.
- Actions: add to queue, add next, add to library, open external/copy URL.
- Loading, empty, error, and quota states.

### Phase 2 - Quick Flow

- `youtube`/`yt` prefix in the command palette.
- Recent search history.
- Short result cache to avoid spending quota while typing and browsing.
- Debounce and request cancellation.
- Paste URL directly in the field to resolve/add video without calling search.

### Phase 3 - Production UX

- Video details before adding.
- Filters: duration, order, live/upcoming, region/language.
- Indicator if video is already in the queue/library.
- Better handling of unavailable/non-embeddable videos when the API/host can detect them.
- Full i18n pt-BR/en.

### Phase 4 - Host Services

- Move sensitive credentials to a host secrets API if it exists.
- Consider `host.youtube.search` to centralize quota, cache, and errors.
- Expose `host.media.previewUrl` if direct preview becomes important.
- Strengthen `host.library.addUrl` to return created item and metadata.

### Phase 5 - Download (If Feasible)

Only proceed if there is a clear legal and technical basis.

- Define permitted scope: own content, authorized content, or prior YouTube approval.
- Implement in the Lumen host, not the module.
- Expose a small SDK API, e.g., `host.media.downloadUrl`, with status/progress/cancellation.
- Persist status in the URL media model already planned by Lumen.
- Never depend on external binaries inside the module.
- Clearly document limits, errors, and user responsibilities.

## Risks and Caveats

- Quota: `search.list` is expensive enough to require careful debounce, cache, and pagination. `videos.list` should batch fetch details by IDs.
- API key: don't embed secrets in code. The client/user must provide their own key; later migrate to `host.secrets` when it exists.
- Networking: use Rust-backed `host.net.request` when available, with network permission in the manifest. Avoid depending on `fetch()` directly as a permanent contract.
- YouTube policies: avoid any download/offline playback without explicit basis.
- UX: API results are not necessarily identical to the YouTube website. The search should feel familiar but not promise perfect parity.
- Partial SDK: some library/queue by URL APIs may be optional; the module should degrade gracefully with a clear message.

## Suggested First Implementation Package

1. Rename/adjust manifest for the module's real identity.
2. Create `youtube-api.ts` layer with types and normalization.
3. Create `YoutubeCommanderApp` with search field and list.
4. Persist API key/preferences in `host.data.json` and expose configuration via gear in the Commander app.
5. Integrate actions with `host.queue.addUrl` and `host.library.addUrl`.
6. Add `youtube` prefix for quick search.
7. Validate module build/pack.

## Open Questions

- Should Enter on a result play now, add to end of queue, add as next, or open details?
- Should the module accept playlists in MVP or only individual videos?
- When `host.secrets` exists, what will the migration flow be for the API key saved in `host.data.json`?
- Should Lumen have a central credentials/connected services screen for modules?
- Is download actually a product requirement, or is the main need to have videos ready in the queue with online playback?
