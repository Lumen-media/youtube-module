import { Kbd } from '@lumen-media/ui';
import { Video } from 'lucide-react';
import { t } from '../i18n.js';
import type { YoutubeVideoResult } from '../youtube-types.js';

interface ResultRowProps {
  video: YoutubeVideoResult;
  selected: boolean;
  onSelect: () => void;
  onPrimaryAction: () => void;
  onAddToQueue: () => void;
  onAddNext: () => void;
  onAddToLibrary: () => void;
  onCtrlEnter: () => void;
  onOpenExternal: () => void;
  onCopyUrl: () => void;
  index: number;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return t('today');
  if (days < 30) return t('daysAgo', { count: days });
  const months = Math.floor(days / 30);
  if (months < 12) return t('monthsAgo', { count: months });
  const years = Math.floor(months / 12);
  return t('yearsAgo', { count: years });
}

const selectedClasses = 'bg-accent outline-2 outline-offset-[-2px] outline-[var(--ring)]';
const baseClasses =
  'flex gap-3 px-3 py-2 cursor-pointer rounded-md transition-[background] duration-100 select-none outline-none';

export function ResultRow({
  video,
  selected,
  onSelect,
  onPrimaryAction,
  onAddToQueue,
  onAddNext,
  onAddToLibrary,
  onCtrlEnter,
  onOpenExternal,
  onCopyUrl,
  index,
}: ResultRowProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (e.shiftKey) {
        onAddToQueue();
      } else if (e.ctrlKey || e.metaKey) {
        onCtrlEnter();
      } else {
        onPrimaryAction();
      }
      return;
    }

    if (e.key === 'o' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      onOpenExternal();
      return;
    }

    if (e.key === 'y' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      onCopyUrl();
      return;
    }

    if (e.key === 'q' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      onAddToQueue();
      return;
    }

    if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      onAddNext();
      return;
    }

    if (e.key === 'l' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      onAddToLibrary();
      return;
    }
  };

  return (
    <div
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      className={`${baseClasses} ${selected ? selectedClasses : ''}`}
      onClick={onPrimaryAction}
      onMouseEnter={onSelect}
      onDoubleClick={onPrimaryAction}
      onKeyDown={handleKeyDown}
      data-index={index}
    >
      <div className="relative shrink-0">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-40 aspect-video rounded object-cover shrink-0 bg-muted"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-40 aspect-video rounded object-cover shrink-0 bg-muted flex items-center justify-center text-muted-foreground">
            <Video size={20} aria-hidden="true" />
          </div>
        )}
        {video.durationSeconds != null && video.durationSeconds > 0 && (
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-px rounded-sm font-semibold">
            {formatDuration(video.durationSeconds)}
          </span>
        )}
        {video.liveBroadcastContent === 'live' && (
          <span className="absolute top-1 left-1 bg-red-600 text-white text-xs font-bold px-1.5 py-px rounded-sm uppercase">
            {t('liveBadge')}
          </span>
        )}
        {video.liveBroadcastContent === 'upcoming' && (
          <span className="absolute top-1 left-1 bg-primary text-white text-xs font-bold px-1.5 py-px rounded-sm uppercase">
            {t('upcomingBadge')}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5 justify-center">
        <div
          className="font-semibold text-sm leading-tight line-clamp-1 text-ellipsis text-foreground"
          title={video.title}
        >
          {video.title}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{video.channelTitle}</div>
        <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
          {video.viewCount != null && (
            <span>{t('views', { count: formatViewCount(video.viewCount) })}</span>
          )}
          {(() => {
            const ago = timeAgo(video.publishedAt);
            return ago ? <span>{ago}</span> : null;
          })()}
        </div>
        {selected && (
          <div className="text-xs text-muted-foreground flex gap-1.5 mt-1 flex-wrap">
            <span>
              <Kbd>↵</Kbd> {t('playAction')}
            </span>
            <span>
              <Kbd>Q</Kbd> {t('queueAction')}
            </span>
            <span>
              <Kbd>N</Kbd> {t('nextAction')}
            </span>
            <span>
              <Kbd>L</Kbd> {t('libraryAction')}
            </span>
            <span>
              <Kbd>O</Kbd> {t('openAction')}
            </span>
            <span>
              <Kbd>Y</Kbd> {t('copyAction')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatViewCount(viewCount: number): string {
  if (viewCount >= 1_000_000) return `${(viewCount / 1_000_000).toFixed(1)}M`;
  if (viewCount >= 1_000) return `${(viewCount / 1_000).toFixed(1)}K`;
  return String(viewCount);
}
