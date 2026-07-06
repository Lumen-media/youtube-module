import './index.css';
import { type CommanderAppProps, type LumenHost, LumenPlugin } from '@lumen-media/module-sdk';
import { TvMinimalPlay } from 'lucide-react';
import { YoutubeCommanderApp } from './components/YoutubeCommanderApp.js';
import { PreferencesStore } from './data/preferences.js';
import { setupI18n, t } from './i18n.js';

export default class YoutubeModulePlugin extends LumenPlugin {
  private prefsStore!: PreferencesStore;

  async onload(host: LumenHost): Promise<void> {
    setupI18n(host.app.locale);

    this.prefsStore = new PreferencesStore(host.data.json);
    await this.prefsStore.load();

    host.commands.add({
      id: 'youtube-module.search',
      title: 'YouTube: Search',
      subtitle: t('commandSubtitle'),
      type: 'app',
      icon: () => <TvMinimalPlay size={16} />,
      commanderSearch: { placeholder: t('searchPlaceholder') },
      component: ({ query, setSearchTrailing }: CommanderAppProps) => (
        <YoutubeCommanderApp
          host={host}
          prefsStore={this.prefsStore}
          commanderQuery={query}
          setSearchTrailing={setSearchTrailing}
        />
      ),
    });

    host.commands.addPrefix({
      prefix: 'youtube',
      title: t('commandTitle'),
      placeholder: t('searchPlaceholder'),
      handle: async (query) => {
        if (!query.trim()) {
          return [];
        }
        return [
          {
            id: 'youtube-search-prefix',
            title: `${t('searchFor')} "${query}"`,
            subtitle: t('pressEnter'),
            commanderSearch: {
              placeholder: t('searchPlaceholder'),
              initialQuery: query,
            },
            component: ({ query: commanderQuery, setSearchTrailing }: CommanderAppProps) => (
              <YoutubeCommanderApp
                host={host}
                prefsStore={this.prefsStore}
                commanderQuery={commanderQuery}
                setSearchTrailing={setSearchTrailing}
              />
            ),
          },
        ];
      },
    });

    host.commands.addPrefix({
      prefix: 'yt',
      title: t('commandTitle'),
      placeholder: t('searchPlaceholder'),
      handle: async (query) => {
        if (!query.trim()) {
          return [];
        }
        return [
          {
            id: 'yt-search-prefix',
            title: `${t('searchFor')} "${query}"`,
            subtitle: t('pressEnter'),
            commanderSearch: {
              placeholder: t('searchPlaceholder'),
              initialQuery: query,
            },
            component: ({ query: commanderQuery, setSearchTrailing }: CommanderAppProps) => (
              <YoutubeCommanderApp
                host={host}
                prefsStore={this.prefsStore}
                commanderQuery={commanderQuery}
                setSearchTrailing={setSearchTrailing}
              />
            ),
          },
        ];
      },
    });

    host.menus.register({
      id: 'youtube-module.menu',
      label: 'YouTube',
      items: [
        {
          type: 'action',
          id: 'youtube-module.search',
          label: 'YouTube: Search',
          onClick: () => host.commands.invoke('youtube-module.search'),
        },
      ],
    });
  }
}
