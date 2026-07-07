import { type CommanderAppProps, type LumenHost, LumenPlugin } from '@lumen-media/module-sdk';

const YoutubeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

import { YoutubeCommanderApp } from './components/YoutubeCommanderApp.js';
import { PreferencesStore } from './data/preferences.js';
import { setupI18n, t } from './i18n.js';
import css from './index.css?inline';

export default class YoutubeModulePlugin extends LumenPlugin {
  private styleEl: HTMLStyleElement | null = null;
  private prefsStore!: PreferencesStore;

  async onload(host: LumenHost): Promise<void> {
    this.styleEl = document.createElement('style');
    this.styleEl.setAttribute('data-module', host.meta.id);
    this.styleEl.textContent = css;
    document.head.appendChild(this.styleEl);

    setupI18n(host.app.locale);

    this.prefsStore = new PreferencesStore(host.data.json);
    await this.prefsStore.load();

    host.commands.add({
      id: 'youtube-module.search',
      title: 'YouTube: Search',
      subtitle: t('commandSubtitle'),
      type: 'app',
      icon: () => <YoutubeIcon size={16} />,
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

  async onunload(): Promise<void> {
    this.styleEl?.remove();
    this.styleEl = null;
  }
}
