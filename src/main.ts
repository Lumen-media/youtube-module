import { type LumenHost, LumenPlugin } from "@lumen-media/module-sdk";
import { setupI18n, t } from "./i18n.js";

export default class YoutubeModulePlugin extends LumenPlugin {
  async onload(host: LumenHost): Promise<void> {
    setupI18n(host.app.locale);

    host.commands.add({
      id: "youtube-module.hello",
      title: "youtube-module: hello",
      run: () => host.ui.notify({ message: t("hello") }),
    });
  }
}
