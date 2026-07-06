import type { JsonStore } from '@lumen-media/module-sdk';
import type { YoutubePreferences } from '../youtube-types.js';

const PREFS_KEY = 'youtube-preferences';

const DEFAULTS: YoutubePreferences = {
  apiKey: '',
  regionCode: 'BR',
  relevanceLanguage: '',
  safeSearch: 'moderate',
  defaultAction: 'addToQueue',
  maxResults: 10,
};

export class PreferencesStore {
  private loaded = false;
  private prefs: YoutubePreferences = { ...DEFAULTS };

  constructor(private store: JsonStore) {}

  async load(): Promise<YoutubePreferences> {
    if (this.loaded) return this.prefs;
    const saved = await this.store.get<Partial<YoutubePreferences>>(PREFS_KEY);
    if (saved && typeof saved === 'object') {
      this.prefs = { ...DEFAULTS, ...saved };
    }
    this.loaded = true;
    return this.prefs;
  }

  async save(partial: Partial<YoutubePreferences>): Promise<YoutubePreferences> {
    this.prefs = { ...this.prefs, ...partial };
    await this.store.set(PREFS_KEY, this.prefs);
    return this.prefs;
  }

  get(): YoutubePreferences {
    return this.prefs;
  }

  hasApiKey(): boolean {
    return Boolean(this.prefs.apiKey?.trim());
  }
}
