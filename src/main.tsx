import { type CommanderAppProps, type LumenHost, LumenPlugin } from '@lumen-media/module-sdk';
import type { Dispatch, SetStateAction } from 'react';
import { YoutubeCommanderApp } from './components/YoutubeCommanderApp.js';
import { YoutubeLogoIcon } from './components/YoutubeLogoIcon.js';
import { PreferencesStore } from './data/preferences.js';
import { setupI18n, t } from './i18n.js';
import css from './index.css?inline';

type CommanderBackHandler = () => boolean | undefined | Promise<boolean | undefined>;
type CommanderBackHandlerSetter = Dispatch<SetStateAction<CommanderBackHandler | undefined>>;
type CommanderAppPropsWithBackHandler = CommanderAppProps & {
  setBackHandler?: CommanderBackHandlerSetter;
};

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
      title: t('commandTitle'),
      subtitle: t('commandSubtitle'),
      type: 'app',
      icon: YoutubeLogoIcon,
      commanderSearch: { placeholder: t('searchPlaceholder') },
      component: ({ query, onBack, setSearchTrailing, setQuery, ...rest }: CommanderAppProps) => (
        <YoutubeCommanderApp
          host={host}
          prefsStore={this.prefsStore}
          commanderQuery={query}
          onBack={onBack}
          setBackHandler={(rest as CommanderAppPropsWithBackHandler).setBackHandler}
          setSearchTrailing={setSearchTrailing}
          setQuery={setQuery}
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
            component: ({
              query: commanderQuery,
              onBack,
              setSearchTrailing,
              setQuery,
              ...rest
            }: CommanderAppProps) => (
              <YoutubeCommanderApp
                host={host}
                prefsStore={this.prefsStore}
                commanderQuery={commanderQuery}
                onBack={onBack}
                setBackHandler={(rest as CommanderAppPropsWithBackHandler).setBackHandler}
                setSearchTrailing={setSearchTrailing}
                setQuery={setQuery}
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
            component: ({
              query: commanderQuery,
              onBack,
              setSearchTrailing,
              setQuery,
              ...rest
            }: CommanderAppProps) => (
              <YoutubeCommanderApp
                host={host}
                prefsStore={this.prefsStore}
                commanderQuery={commanderQuery}
                onBack={onBack}
                setBackHandler={(rest as CommanderAppPropsWithBackHandler).setBackHandler}
                setSearchTrailing={setSearchTrailing}
                setQuery={setQuery}
              />
            ),
          },
        ];
      },
    });

    host.menus.register({
      id: 'youtube-module.menu',
      label: t('commandTitle'),
      items: [
        {
          type: 'action',
          id: 'youtube-module.search',
          label: t('commandTitle'),
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
