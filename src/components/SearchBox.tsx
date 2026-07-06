import { Input, Kbd } from '@lumen-media/ui';
import { X } from 'lucide-react';
import { useRef } from 'react';
import { t } from '../i18n.js';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function SearchBox({ value, onChange, onClear, disabled, placeholder }: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative flex items-center gap-2 px-3 py-2">
      <span className="shrink-0 text-muted-foreground text-lg">🔍</span>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={placeholder ?? t('searchPlaceholder')}
        disabled={disabled}
        autoFocus
        className="flex-1"
      />
      {value && (
        <button
          onClick={onClear}
          className="bg-transparent border-none cursor-pointer text-muted-foreground text-base px-2 py-1"
          aria-label={t('clearSearch')}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
      <Kbd>/</Kbd>
    </div>
  );
}
