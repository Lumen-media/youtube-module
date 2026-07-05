import { Kbd } from "@lumen-media/ui"
import type { YoutubeVideoResult } from "../youtube-types.js"
import { t } from "../i18n.js"

interface ResultRowProps {
  video: YoutubeVideoResult
  selected: boolean
  onSelect: () => void
  onPlay: () => void
  onAddToQueue: () => void
  onAddNext: () => void
  onAddToLibrary: () => void
  onOpenExternal: () => void
  onCopyUrl: () => void
  index: number
}

function formatDuration(seconds?: number): string {
  if (!seconds) return ""
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ""
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return t("today")
  if (days < 30) return t("daysAgo", { count: days })
  const months = Math.floor(days / 30)
  if (months < 12) return t("monthsAgo", { count: months })
  const years = Math.floor(months / 12)
  return t("yearsAgo", { count: years })
}

const rowStyle = (selected: boolean): React.CSSProperties => ({
  display: "flex",
  gap: 12,
  padding: "8px 12px",
  cursor: "pointer",
  background: selected ? "var(--accent)" : "transparent",
  outline: selected ? "2px solid var(--ring)" : "none",
  outlineOffset: selected ? "-2px" : undefined,
  borderRadius: 6,
  transition: "background 0.1s",
  userSelect: "none",
})

const thumbnailStyle: React.CSSProperties = {
  width: 120,
  height: 68,
  borderRadius: 4,
  objectFit: "cover",
  flexShrink: 0,
  background: "var(--muted)",
}

const infoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 2,
  justifyContent: "center",
}

export function ResultRow({
  video,
  selected,
  onSelect,
  onPlay,
  onAddToQueue,
  onAddNext,
  onAddToLibrary,
  onOpenExternal,
  onCopyUrl,
  index,
}: ResultRowProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (e.shiftKey) {
        onAddToQueue()
      } else if (e.ctrlKey || e.metaKey) {
        onAddToLibrary()
      } else {
        onPlay()
      }
      return
    }

    if (e.key === "o" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      onOpenExternal()
      return
    }

    if (e.key === "y" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      onCopyUrl()
      return
    }

    if (e.key === "q" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      onAddToQueue()
      return
    }

    if (e.key === "n" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      onAddNext()
      return
    }

    if (e.key === "l" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      onAddToLibrary()
      return
    }
  }

  return (
    <div
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      style={rowStyle(selected)}
      onClick={onPlay}
      onMouseEnter={onSelect}
      onDoubleClick={onPlay}
      onKeyDown={handleKeyDown}
      data-index={index}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} style={thumbnailStyle} loading="lazy" />
        ) : (
          <div style={{ ...thumbnailStyle, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)" }}>
            🎬
          </div>
        )}
        {video.durationSeconds != null && video.durationSeconds > 0 && (
          <span
            style={{
              position: "absolute",
              bottom: 4,
              right: 4,
              background: "rgba(0,0,0,0.8)",
              color: "#fff",
              fontSize: 11,
              padding: "1px 4px",
              borderRadius: 3,
              fontWeight: 600,
            }}
          >
            {formatDuration(video.durationSeconds)}
          </span>
        )}
        {video.liveBroadcastContent === "live" && (
          <span
            style={{
              position: "absolute",
              top: 4,
              left: 4,
              background: "red",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              padding: "1px 5px",
              borderRadius: 3,
              textTransform: "uppercase",
            }}
          >
            LIVE
          </span>
        )}
        {video.liveBroadcastContent === "upcoming" && (
          <span
            style={{
              position: "absolute",
              top: 4,
              left: 4,
              background: "var(--primary)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              padding: "1px 5px",
              borderRadius: 3,
              textTransform: "uppercase",
            }}
          >
            UPCOMING
          </span>
        )}
      </div>

      <div style={infoStyle}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            color: "var(--foreground)",
          }}
          title={video.title}
        >
          {video.title}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>
          {video.channelTitle}
        </div>
        <div style={{ fontSize: 11, color: "var(--muted-foreground)", display: "flex", gap: 8, marginTop: 2 }}>
          {video.viewCount != null && <span>{t("views", { count: formatViewCount(video.viewCount) })}</span>}
          {timeAgo(video.publishedAt) && <span>{timeAgo(video.publishedAt)}</span>}
        </div>
        {selected && (
          <div style={{ fontSize: 11, color: "var(--muted-foreground)", display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            <span><Kbd>↵</Kbd> {t("playAction")}</span>
            <span><Kbd>Q</Kbd> {t("queueAction")}</span>
            <span><Kbd>N</Kbd> {t("nextAction")}</span>
            <span><Kbd>L</Kbd> {t("libraryAction")}</span>
            <span><Kbd>O</Kbd> {t("openAction")}</span>
            <span><Kbd>Y</Kbd> {t("copyAction")}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function formatViewCount(viewCount: number): string {
  if (viewCount >= 1_000_000) return `${(viewCount / 1_000_000).toFixed(1)}M`
  if (viewCount >= 1_000) return `${(viewCount / 1_000).toFixed(1)}K`
  return String(viewCount)
}
