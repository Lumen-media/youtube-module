import { useCallback, useEffect, useRef, useState } from "react"
import { Button, Empty } from "@lumen-media/module-sdk/ui"
import type { LumenHost } from "@lumen-media/module-sdk"
import type { YoutubeVideoResult, YoutubePreferences, SearchError } from "../youtube-types.js"
import { YoutubeApi } from "../youtube-api.js"
import { isYouTubeUrl, parseVideoId, makeVideoUrl } from "../youtube-url.js"
import { PreferencesStore } from "../data/preferences.js"
import { SearchBox } from "./SearchBox.js"
import { ResultList } from "./ResultList.js"
import { SettingsView } from "./SettingsView.js"
import { t } from "../i18n.js"

interface YoutubeCommanderAppProps {
  host: LumenHost
  prefsStore: PreferencesStore
  initialQuery?: string
}

type ViewState = "search" | "settings"

export function YoutubeCommanderApp({ host, prefsStore, initialQuery }: YoutubeCommanderAppProps) {
  const [view, setView] = useState<ViewState>("search")
  const [query, setQuery] = useState(initialQuery ?? "")
  const [results, setResults] = useState<YoutubeVideoResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<SearchError | null>(null)
  const [prefs, setPrefs] = useState<YoutubePreferences>(prefsStore.get())

  const apiRef = useRef(new YoutubeApi(host.net, prefs))
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    apiRef.current = new YoutubeApi(host.net, prefs)
  }, [prefs, host.net])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setError(null)
      return
    }

    const urlId = parseVideoId(q.trim())
    if (urlId) {
      setResults([{
        videoId: urlId,
        url: makeVideoUrl(urlId),
        title: q.trim(),
        channelTitle: "",
        thumbnailUrl: `https://i.ytimg.com/vi/${urlId}/mqdefault.jpg`,
      }])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const page = await apiRef.current.search(q.trim())
      setResults(page.results)
      setSelectedIndex(0)
    } catch (err: unknown) {
      setError(err as SearchError)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      doSearch(query)
    }, 300)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [query, doSearch])

  const handleClearSearch = () => {
    setQuery("")
    setResults([])
    setError(null)
  }

  const handlePlay = (video: YoutubeVideoResult) => {
    host.ui.notify({ message: t("playingVideo", { title: video.title }) })
    host.player.play?.(video.videoId)
  }

  const handleAddToQueue = useCallback((video: YoutubeVideoResult) => {
    try {
      ;(host.queue as Record<string, unknown>).addUrl?.({ url: video.url, position: "end" })
    } catch {
      // API not available yet
    }
    host.ui.notify({ message: t("addedToQueue", { title: video.title }) })
  }, [host])

  const handleAddNext = useCallback((video: YoutubeVideoResult) => {
    try {
      ;(host.queue as Record<string, unknown>).addUrl?.({ url: video.url, position: "next" })
    } catch {
      // API not available yet
    }
    host.ui.notify({ message: t("addedNext", { title: video.title }) })
  }, [host])

  const handleAddToLibrary = useCallback((video: YoutubeVideoResult) => {
    try {
      ;(host.library as Record<string, unknown>).addUrl?.({ url: video.url })
    } catch {
      // API not available yet
    }
    host.ui.notify({ message: t("addedToLibrary", { title: video.title }) })
  }, [host])

  const handleOpenExternal = (video: YoutubeVideoResult) => {
    window.open(video.url, "_blank")
  }

  const handleCopyUrl = async (video: YoutubeVideoResult) => {
    try {
      await navigator.clipboard.writeText(video.url)
      host.ui.notify({ message: t("copiedUrl") })
    } catch {
      host.ui.notify({ message: t("copyFailed"), level: "error" })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
      return
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
      return
    }

    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      // handled by ResultRow onKeyDown
      return
    }
  }

  const handleSavePrefs = async (newPrefs: YoutubePreferences) => {
    const saved = await prefsStore.save(newPrefs)
    setPrefs(saved)
  }

  const hasKey = prefsStore.hasApiKey()
  const showEmptyState = !loading && !error && results.length === 0 && !query.trim()

  if (view === "settings") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <SettingsView
          prefs={prefs}
          onSave={handleSavePrefs}
          onClose={() => setView("search")}
        />
      </div>
    )
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
        <SearchBox
          value={query}
          onChange={setQuery}
          onClear={handleClearSearch}
          disabled={!hasKey && !loading}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView("settings")}
          style={{ marginRight: 8, fontSize: 18 }}
          aria-label={t("settings")}
        >
          ⚙
        </Button>
      </div>

      {loading && (
        <div style={{ padding: 16, textAlign: "center", color: "var(--muted-foreground)" }}>
          {t("searching")}
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: 16 }}>
          <ErrorState error={error} onOpenSettings={() => setView("settings")} />
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <ResultList
          results={results}
          selectedIndex={selectedIndex}
          onSelectIndex={setSelectedIndex}
          onPlay={handlePlay}
          onAddToQueue={handleAddToQueue}
          onAddNext={handleAddNext}
          onAddToLibrary={handleAddToLibrary}
          onOpenExternal={handleOpenExternal}
          onCopyUrl={handleCopyUrl}
        />
      )}

      {showEmptyState && !hasKey && (
        <div style={{ padding: 16 }}>
          <Empty>
            <Empty.Media>🎬</Empty.Media>
            <Empty.Header>
              <Empty.Title>{t("noKeyTitle")}</Empty.Title>
              <Empty.Description>{t("noKeyDescription")}</Empty.Description>
            </Empty.Header>
            <Empty.Content>
              <Button onClick={() => setView("settings")}>
                {t("configureKey")}
              </Button>
            </Empty.Content>
          </Empty>
        </div>
      )}

      {showEmptyState && hasKey && query.trim() === "" && !initialQuery && (
        <div style={{ padding: 16 }}>
          <Empty>
            <Empty.Media>🔍</Empty.Media>
            <Empty.Header>
              <Empty.Title>{t("searchReady")}</Empty.Title>
              <Empty.Description>{t("searchReadyDescription")}</Empty.Description>
            </Empty.Header>
          </Empty>
        </div>
      )}

      {!loading && !error && hasKey && query.trim() && results.length === 0 && (
        <div style={{ padding: 16 }}>
          <Empty>
            <Empty.Media>📭</Empty.Media>
            <Empty.Header>
              <Empty.Title>{t("noResults")}</Empty.Title>
              <Empty.Description>{t("noResultsDescription")}</Empty.Description>
            </Empty.Header>
          </Empty>
        </div>
      )}
    </div>
  )
}

function ErrorState({ error, onOpenSettings }: { error: SearchError; onOpenSettings: () => void }) {
  switch (error.type) {
    case "missing_key":
      return (
        <Empty>
          <Empty.Media>🔑</Empty.Media>
          <Empty.Header>
            <Empty.Title>{t("noKeyTitle")}</Empty.Title>
            <Empty.Description>{t("noKeyDescription")}</Empty.Description>
          </Empty.Header>
          <Empty.Content>
            <Button onClick={onOpenSettings}>{t("configureKey")}</Button>
          </Empty.Content>
        </Empty>
      )

    case "invalid_key":
      return (
        <Empty>
          <Empty.Media>🔑</Empty.Media>
          <Empty.Header>
            <Empty.Title>{t("invalidKeyTitle")}</Empty.Title>
            <Empty.Description>{t("invalidKeyDescription")}</Empty.Description>
          </Empty.Header>
          <Empty.Content>
            <Button onClick={onOpenSettings}>{t("editKey")}</Button>
          </Empty.Content>
        </Empty>
      )

    case "quota_exceeded":
      return (
        <Empty>
          <Empty.Media>📊</Empty.Media>
          <Empty.Header>
            <Empty.Title>{t("quotaTitle")}</Empty.Title>
            <Empty.Description>{t("quotaDescription")}</Empty.Description>
          </Empty.Header>
        </Empty>
      )

    case "network":
      return (
        <Empty>
          <Empty.Media>🌐</Empty.Media>
          <Empty.Header>
            <Empty.Title>{t("networkTitle")}</Empty.Title>
            <Empty.Description>{error.message}</Empty.Description>
          </Empty.Header>
          <Empty.Content>
            <Button onClick={() => window.location.reload()}>{t("retry")}</Button>
          </Empty.Content>
        </Empty>
      )

    case "api":
      return (
        <Empty>
          <Empty.Media>⚠️</Empty.Media>
          <Empty.Header>
            <Empty.Title>{t("apiErrorTitle")}</Empty.Title>
            <Empty.Description>{error.message}</Empty.Description>
          </Empty.Header>
        </Empty>
      )
  }
}
