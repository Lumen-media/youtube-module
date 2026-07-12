import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect } from 'react';
import type { YoutubeVideoResult } from '../youtube-types.js';
import { ResultRow } from './ResultRow.js';

interface ResultListProps {
  results: YoutubeVideoResult[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  shouldScrollRef: React.RefObject<boolean | null>;
  onPrimaryAction: (video: YoutubeVideoResult) => void;
  onAddToQueue: (video: YoutubeVideoResult) => void;
  onAddNext: (video: YoutubeVideoResult) => void;
  onAddToLibrary: (video: YoutubeVideoResult) => void;
  onCtrlEnter: (video: YoutubeVideoResult) => void;
  onOpenExternal: (video: YoutubeVideoResult) => void;
  onCopyUrl: (video: YoutubeVideoResult) => void;
}

export function ResultList({
  results,
  selectedIndex,
  onSelectIndex,
  scrollRef,
  shouldScrollRef,
  onPrimaryAction,
  onAddToQueue,
  onAddNext,
  onAddToLibrary,
  onCtrlEnter,
  onOpenExternal,
  onCopyUrl,
}: ResultListProps) {
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 110,
    overscan: 6,
    measureElement: (el) => el.getBoundingClientRect().height,
    getItemKey: (index) => results[index]?.url ?? index,
  });

  useEffect(() => {
    virtualizer.measure();
  }, [virtualizer]);

  useEffect(() => {
    if (shouldScrollRef?.current) {
      virtualizer.scrollToIndex(selectedIndex, { align: 'auto' });
      shouldScrollRef.current = false;
    }
  }, [selectedIndex, virtualizer, shouldScrollRef]);

  if (results.length === 0) return null;

  return (
    <div
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        position: 'relative',
      }}
    >
      {virtualizer.getVirtualItems().map((virtualItem) => {
        const video = results[virtualItem.index];
        return (
          <div
            key={virtualItem.key}
            ref={virtualizer.measureElement}
            data-index={virtualItem.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ResultRow
              video={video}
              selected={virtualItem.index === selectedIndex}
              onSelect={() => onSelectIndex(virtualItem.index)}
              onPrimaryAction={() => onPrimaryAction(video)}
              onAddToQueue={() => onAddToQueue(video)}
              onAddNext={() => onAddNext(video)}
              onAddToLibrary={() => onAddToLibrary(video)}
              onCtrlEnter={() => onCtrlEnter(video)}
              onOpenExternal={() => onOpenExternal(video)}
              onCopyUrl={() => onCopyUrl(video)}
              index={virtualItem.index}
            />
          </div>
        );
      })}
    </div>
  );
}
