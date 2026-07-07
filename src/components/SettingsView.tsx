import { Button, HoverCard, Input, Label, Select } from '@lumen-media/ui';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { t } from '../i18n.js';
import type { YoutubePreferences } from '../youtube-types.js';

interface SettingsViewProps {
  prefs: YoutubePreferences;
  onSave: (prefs: YoutubePreferences) => Promise<void>;
  onClose: () => void;
}

export function SettingsView({ prefs, onSave, onClose }: SettingsViewProps) {
  const [apiKey, setApiKey] = useState(prefs.apiKey);
  const [apiKeyBackup, setApiKeyBackup] = useState(prefs.apiKeyBackup);
  const [regionCode, setRegionCode] = useState(prefs.regionCode);
  const [relevanceLanguage, setRelevanceLanguage] = useState(prefs.relevanceLanguage);
  const [safeSearch, setSafeSearch] = useState(prefs.safeSearch);
  const [defaultAction, setDefaultAction] = useState(prefs.defaultAction);
  const [maxResults, setMaxResults] = useState(prefs.maxResults);
  const [visible, setVisible] = useState(false);
  const [showBackup, setShowBackup] = useState(!!prefs.apiKeyBackup);
  const [saving, setSaving] = useState(false);
  const [apiKeyInteractive, setApiKeyInteractive] = useState(false);
  const [backupKeyInteractive, setBackupKeyInteractive] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        apiKey,
        apiKeyBackup,
        regionCode,
        relevanceLanguage,
        safeSearch,
        defaultAction,
        maxResults,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const maskedKey = apiKey ? `${apiKey.slice(0, 4)}••••${apiKey.slice(-4)}` : '';
  const autofillProps = {
    autoComplete: 'off',
    autoCorrect: 'off' as const,
    spellCheck: false,
    'data-1p-ignore': 'true',
    'data-lpignore': 'true',
  };

  const getSecretInputProps = (
    interactive: boolean,
    setInteractive: (value: boolean) => void,
    name: string
  ) => ({
    autoComplete: 'new-password',
    autoCorrect: 'off' as const,
    autoCapitalize: 'none' as const,
    spellCheck: false,
    inputMode: 'text' as const,
    readOnly: !interactive,
    name,
    id: name,
    'aria-autocomplete': 'none' as const,
    'data-form-type': 'other',
    'data-1p-ignore': 'true',
    'data-lpignore': 'true',
    'data-bwignore': 'true',
    onFocus: () => setInteractive(true),
    onPointerDown: () => setInteractive(true),
  });

  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-base font-semibold m-0">{t('settingsTitle')}</h2>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <Label>{t('apiKeyLabel')}</Label>
          <HoverCard>
            <HoverCard.HoverCardTrigger className="cursor-help inline-flex items-center">
              <Info size={14} className="text-muted-foreground" aria-hidden="true" />
            </HoverCard.HoverCardTrigger>
            <HoverCard.HoverCardContent
              side="top"
              sideOffset={4}
              className="max-w-72 text-xs leading-relaxed"
            >
              {t('apiKeyBackupHint')}
            </HoverCard.HoverCardContent>
          </HoverCard>
        </div>
        <div className="flex gap-2 items-center">
          <Input
            type={visible ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.currentTarget.value)}
            placeholder={t('apiKeyPlaceholder')}
            {...getSecretInputProps(
              apiKeyInteractive,
              setApiKeyInteractive,
              'lumen-youtube-api-key'
            )}
            className="flex-1 font-mono"
          />
          <Button variant="ghost" size="sm" onClick={() => setVisible(!visible)}>
            {visible ? t('hide') : t('show')}
          </Button>
        </div>
        {apiKey && !visible && (
          <span className="text-xs text-muted-foreground font-mono">{maskedKey}</span>
        )}
        <p className="text-xs text-muted-foreground mt-0.5 mb-0">
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {t('getKey')}
          </a>
          . {t('apiKeyHint')}
        </p>
      </div>

      {showBackup ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Label>{t('apiKeyBackupLabel')}</Label>
            <button
              type="button"
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setShowBackup(false);
                setApiKeyBackup('');
              }}
            >
              {t('remove')}
            </button>
          </div>
          <Input
            type={visible ? 'text' : 'password'}
            value={apiKeyBackup}
            onChange={(e) => setApiKeyBackup(e.currentTarget.value)}
            placeholder={t('apiKeyBackupPlaceholder')}
            {...getSecretInputProps(
              backupKeyInteractive,
              setBackupKeyInteractive,
              'lumen-youtube-backup-api-key'
            )}
            className="flex-1 font-mono"
          />
          {apiKeyBackup && !visible && (
            <span className="text-xs text-muted-foreground font-mono">
              {apiKeyBackup.slice(0, 4)}••••{apiKeyBackup.slice(-4)}
            </span>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground self-start"
          onClick={() => setShowBackup(true)}
        >
          <span className="text-xs">+</span>
          {t('addBackupKey')}
        </button>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label>{t('regionLabel')}</Label>
          <Input
            value={regionCode}
            onChange={(e) => setRegionCode(e.currentTarget.value.toUpperCase())}
            placeholder="BR"
            maxLength={2}
            autoCapitalize="characters"
            className="w-full"
            {...autofillProps}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label>{t('languageLabel')}</Label>
          <Input
            value={relevanceLanguage}
            onChange={(e) => setRelevanceLanguage(e.currentTarget.value)}
            placeholder="pt"
            maxLength={2}
            autoCapitalize="none"
            className="w-full"
            {...autofillProps}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label>{t('safeSearchLabel')}</Label>
          <Select
            value={safeSearch}
            onValueChange={(v) => setSafeSearch(v as YoutubePreferences['safeSearch'])}
          >
            <Select.SelectTrigger className="w-full">
              <Select.SelectValue />
            </Select.SelectTrigger>
            <Select.SelectContent>
              <Select.SelectItem value="none">{t('safeNone')}</Select.SelectItem>
              <Select.SelectItem value="moderate">{t('safeModerate')}</Select.SelectItem>
              <Select.SelectItem value="strict">{t('safeStrict')}</Select.SelectItem>
            </Select.SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label>{t('maxResultsLabel')}</Label>
          <Select
            value={String(maxResults)}
            onValueChange={(v) => setMaxResults(Number(v) as YoutubePreferences['maxResults'])}
          >
            <Select.SelectTrigger className="w-full">
              <Select.SelectValue />
            </Select.SelectTrigger>
            <Select.SelectContent>
              <Select.SelectItem value="5">5</Select.SelectItem>
              <Select.SelectItem value="10">10</Select.SelectItem>
              <Select.SelectItem value="25">25</Select.SelectItem>
              <Select.SelectItem value="50">50</Select.SelectItem>
            </Select.SelectContent>
          </Select>
        </div>

        <div className="col-span-full grid grid-cols-2 gap-3 items-end">
          <div className="flex flex-col gap-1">
            <Label>{t('defaultActionLabel')}</Label>
            <Select
              value={defaultAction}
              onValueChange={(v) => setDefaultAction(v as YoutubePreferences['defaultAction'])}
            >
              <Select.SelectTrigger className="w-full">
                <Select.SelectValue />
              </Select.SelectTrigger>
              <Select.SelectContent>
                <Select.SelectItem value="addToQueue">{t('actionAddToQueue')}</Select.SelectItem>
                <Select.SelectItem value="playNow">{t('actionPlayNow')}</Select.SelectItem>
              </Select.SelectContent>
            </Select>
          </div>

          <div className="flex h-10 items-center justify-end gap-2 self-end">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t('saving') : t('save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}




