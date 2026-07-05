import { Input, Kbd } from "@lumen-media/ui"
import { t } from "../i18n.js"

interface SearchBoxProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  disabled?: boolean
  placeholder?: string
}

export function SearchBox({ value, onChange, onClear, disabled, placeholder }: SearchBoxProps) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
      <span style={{ flexShrink: 0, color: "var(--muted-foreground)", fontSize: 18 }}>🔍</span>
      <Input
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={placeholder ?? t("searchPlaceholder")}
        disabled={disabled}
        autoFocus
        style={{ flex: 1 }}
      />
      {value && (
        <button
          onClick={onClear}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--muted-foreground)",
            fontSize: 16,
            padding: "4px 8px",
          }}
          aria-label={t("clearSearch")}
        >
          ✕
        </button>
      )}
      <Kbd>/</Kbd>
    </div>
  )
}
