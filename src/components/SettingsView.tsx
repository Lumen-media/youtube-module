import { Button, Input, Label, Select } from '@lumen-media/ui';
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
  const [regionCode, setRegionCode] = useState(prefs.regionCode);
  const [relevanceLanguage, setRelevanceLanguage] = useState(prefs.relevanceLanguage);
  const [safeSearch, setSafeSearch] = useState(prefs.safeSearch);
  const [defaultAction, setDefaultAction] = useState(prefs.defaultAction);
  const [maxResults, setMaxResults] = useState(prefs.maxResults);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        apiKey,
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

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('settingsTitle')}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Label>{t('apiKeyLabel')}</Label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input
            type={visible ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.currentTarget.value)}
            placeholder={t('apiKeyPlaceholder')}
            style={{ flex: 1, fontFamily: 'monospace' }}
          />
          <Button variant="ghost" size="sm" onClick={() => setVisible(!visible)}>
            {visible ? t('hide') : t('show')}
          </Button>
        </div>
        {apiKey && !visible && (
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
            {maskedKey}
          </span>
        )}
        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: '2px 0 0' }}>
          {t('apiKeyHint')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label>{t('regionLabel')}</Label>
          <Input
            value={regionCode}
            onChange={(e) => setRegionCode(e.currentTarget.value.toUpperCase())}
            placeholder="BR"
            maxLength={2}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label>{t('languageLabel')}</Label>
          <Input
            value={relevanceLanguage}
            onChange={(e) => setRelevanceLanguage(e.currentTarget.value)}
            placeholder="pt"
            maxLength={2}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label>{t('safeSearchLabel')}</Label>
          <Select
            value={safeSearch}
            onValueChange={(v) => setSafeSearch(v as YoutubePreferences['safeSearch'])}
          >
            <Select.SelectTrigger style={{ width: '100%' }}>
              <Select.SelectValue />
            </Select.SelectTrigger>
            <Select.SelectContent>
              <Select.SelectItem value="none">{t('safeNone')}</Select.SelectItem>
              <Select.SelectItem value="moderate">{t('safeModerate')}</Select.SelectItem>
              <Select.SelectItem value="strict">{t('safeStrict')}</Select.SelectItem>
            </Select.SelectContent>
          </Select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label>{t('maxResultsLabel')}</Label>
          <Select
            value={String(maxResults)}
            onValueChange={(v) => setMaxResults(Number(v) as YoutubePreferences['maxResults'])}
          >
            <Select.SelectTrigger style={{ width: '100%' }}>
              <Select.SelectValue />
            </Select.SelectTrigger>
            <Select.SelectContent>
              <Select.SelectItem value="10">10</Select.SelectItem>
              <Select.SelectItem value="25">25</Select.SelectItem>
              <Select.SelectItem value="50">50</Select.SelectItem>
            </Select.SelectContent>
          </Select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
          <Label>{t('defaultActionLabel')}</Label>
          <Select
            value={defaultAction}
            onValueChange={(v) => setDefaultAction(v as YoutubePreferences['defaultAction'])}
          >
            <Select.SelectTrigger style={{ width: '100%' }}>
              <Select.SelectValue />
            </Select.SelectTrigger>
            <Select.SelectContent>
              <Select.SelectItem value="addToQueue">{t('actionAddToQueue')}</Select.SelectItem>
              <Select.SelectItem value="playNow">{t('actionPlayNow')}</Select.SelectItem>
            </Select.SelectContent>
          </Select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          {t('cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t('saving') : t('save')}
        </Button>
      </div>
    </div>
  );
}
