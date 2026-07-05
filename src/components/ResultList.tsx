import { useCallback, useEffect, useRef } from "react"
import { ScrollArea } from "@lumen-media/ui"
import type { YoutubeVideoResult } from "../youtube-types.js"
import { ResultRow } from "./ResultRow.js"

interface ResultListProps {
  results: YoutubeVideoResult[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
  onPlay: (video: YoutubeVideoResult) => void
  onAddToQueue: (video: YoutubeVideoResult) => void
  onAddNext: (video: YoutubeVideoResult) => void
  onAddToLibrary: (video: YoutubeVideoResult) => void
  onOpenExternal: (video: YoutubeVideoResult) => void
  onCopyUrl: (video: YoutubeVideoResult) => void
}

export function ResultList({
  results,
  selectedIndex,
  onSelectIndex,
  onPlay,
  onAddToQueue,
  onAddNext,
  onAddToLibrary,
  onOpenExternal,
  onCopyUrl,
}: ResultListProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const scrollToIndex = useCallback((index: number) => {
    const el = listRef.current?.querySelector(`[data-index="${index}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [])

  useEffect(() => {
    scrollToIndex(selectedIndex)
  }, [selectedIndex, scrollToIndex])

  if (results.length === 0) return null

  return (
    <ScrollArea style={{ flex: 1, overflow: "auto" }}>
      <div ref={listRef} role="listbox" aria-label="Search results" style={{ padding: "4px 0" }}>
        {results.map((video, index) => (
          <ResultRow
            key={video.videoId}
            video={video}
            selected={index === selectedIndex}
            onSelect={() => onSelectIndex(index)}
            onPlay={() => onPlay(video)}
            onAddToQueue={() => onAddToQueue(video)}
            onAddNext={() => onAddNext(video)}
            onAddToLibrary={() => onAddToLibrary(video)}
            onOpenExternal={() => onOpenExternal(video)}
            onCopyUrl={() => onCopyUrl(video)}
            index={index}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
