# YouTube Module Plan

## Objetivo

Criar um modulo do Lumen focado em descobrir videos do YouTube dentro do Commander e mandar esses videos para o fluxo nativo do Lumen: preview, fila, biblioteca e reproducao. O modulo deve usar a SDK publica do Lumen sempre que possivel e deixar qualquer trabalho privilegiado, nativo ou sensivel para APIs do host.

A primeira versao nao deve tentar ser um clone completo do YouTube. Ela deve resolver bem o caso de uso do Lumen: procurar um video rapidamente durante preparacao/apresentacao e colocar esse video no lugar certo sem sair do app.

## Decisoes iniciais

- A UI principal sera um Commander app registrado com `host.commands.add({ type: "app" })`.
- Tambem vale registrar um prefixo `youtube <busca>` para busca rapida direto na paleta.
- A busca pode usar YouTube Data API v3 no modulo via `host.net`, desde que a chave seja configurada pelo usuario.
- A chave da API nao deve ser embutida no bundle do modulo.
- Por padrao, cada cliente/instalacao informa a propria Google API key depois de instalar o modulo.
- A tela principal precisa ter uma engrenagem de configuracao para editar API key e preferencias sem sair do fluxo do Commander.
- O modulo deve persistir preferencias simples com `host.data.json` e historico/cache estruturado com `host.data.sqlite` se necessario.
- Reproducao inicial deve ser por URL do YouTube usando as APIs ja planejadas/implementadas no Lumen: `host.library.addUrl` e `host.queue.addUrl`.
- Download de video/audio nao entra no MVP do modulo.
- Se download existir depois, deve morar no Lumen host, provavelmente em Rust/Tauri, exposto por uma API da SDK. O modulo so chamaria essa API.

## Por que download fica fora do MVP

A politica oficial de YouTube API Services diz que clientes nao devem baixar, importar, fazer backup, cachear ou armazenar copias de conteudo audiovisual do YouTube sem aprovacao previa do YouTube. Tambem proibe separar/isolar componentes de audio ou video e usar tecnologias fora das APIs do YouTube para recuperar conteudo audiovisual.

Implicacao para o Lumen:

- `yt-dlp`, scraping, extração de stream e download direto nao devem ser a base publica do modulo.
- O caminho seguro e reproduzir via player/URL embutivel e deixar o Lumen guardar apenas metadados permitidos e thumbnails conforme a arquitetura existente.
- Uma feature futura de download precisa ter escopo explicito: conteudo proprio/autorizado, aprovacao, ou outra fonte legalmente permitida. Essa feature deve ser implementada no host, nao no modulo.

Fontes oficiais consultadas:

- YouTube Data API `search.list`: https://developers.google.com/youtube/v3/docs/search/list
- YouTube Data API `videos.list`: https://developers.google.com/youtube/v3/docs/videos/list
- YouTube API Services Developer Policies: https://developers.google.com/youtube/terms/developer-policies

## Experiencia do usuario

### Commander app

Comando principal:

- `YouTube: Search`
- Abre uma tela dentro do Commander.
- Campo de busca no topo.
- Lista de resultados com thumbnail, titulo, canal, duracao, data e indicadores como live/upcoming quando disponivel.
- Acoes por resultado:
  - Play/preview agora
  - Add to queue
  - Add next
  - Add to library
  - Open on YouTube
  - Copy URL

### Prefixo rapido

Prefixo:

- `youtube oceans hillsong`
- `yt oceans hillsong` como alias, se a SDK permitir ou se registrarmos dois prefixos.

Comportamento:

- Sem query: mostra resultados recentes do historico ou sugestao para configurar API key.
- Com query: retorna resultados compactos direto na paleta.
- Enter em um resultado deve adicionar a fila ou abrir uma tela de detalhes, a decidir.
- Shift/acao secundaria pode virar `Add next` depois que a UI suportar atalhos mais ricos.

### Configuracao

Como `host.settings` ainda nao persiste de forma completa, usar `host.data.json` por enquanto.

Campos:

- `apiKey`: chave do YouTube Data API v3 do usuario.
- `regionCode`: padrao `BR` ou vazio para usar comportamento global.
- `relevanceLanguage`: padrao vindo do locale do app quando fizer sentido.
- `safeSearch`: `moderate` por padrao.
- `defaultAction`: `addToQueue` ou `details`.
- `maxResults`: 10, 25 ou 50.

A tela deve ter um estado claro para chave ausente, quota excedida, rede offline e erro de permissao da API.

### UI de configuracao

A configuracao deve ser acessivel por uma engrenagem visivel no canto superior direito do Commander app do YouTube. Essa engrenagem abre uma view/painel interno de settings do proprio modulo, sem depender inicialmente da tela global de settings do Lumen.

Requisitos da engrenagem/config:

- Aparecer na tela de busca e nos estados de erro/chave ausente.
- Abrir uma view `SettingsView` com campo de API key, preferencias de busca e acoes de salvar/cancelar.
- Permitir testar a chave com uma chamada leve antes de salvar, se a quota permitir.
- Mostrar a chave mascarada depois de salva, com acao explicita para revelar/editar.
- Explicar que a chave pertence ao cliente/usuario e nao e fornecida pelo Lumen nem pelo modulo.
- Persistir no MVP com `host.data.json`; migrar para `host.secrets` quando o Lumen tiver esse servico.

Estados esperados:

- Sem chave: mostrar tela vazia com CTA para abrir configuracao.
- Chave invalida: mostrar erro e atalho para editar configuracao.
- Quota excedida: mostrar aviso e manter historico/cache disponivel.
- Offline/falha de rede: mostrar erro recuperavel com retry.

## Arquitetura do modulo

Estrutura sugerida:

```txt
src/
  main.ts
  youtube-api.ts
  youtube-types.ts
  youtube-url.ts
  components/
    YoutubeCommanderApp.tsx
    SearchBox.tsx
    ResultList.tsx
    ResultRow.tsx
    SettingsView.tsx
  data/
    preferences.ts
    recent-searches.ts
```

### `main.ts`

Responsabilidades:

- Inicializar i18n.
- Carregar preferencias.
- Registrar comando app `youtube-module.search`.
- Registrar prefixo `youtube`.
- Registrar menu opcional em `Modules > YouTube`.

### `youtube-api.ts`

Responsabilidades:

- Chamar `search.list` com `part=snippet`, `type=video`, `q`, `maxResults`, `regionCode`, `relevanceLanguage`, `safeSearch` e `pageToken`.
- Usar `videos.list` para enriquecer os resultados com `contentDetails`, `statistics` e talvez `status`.
- Normalizar resposta em um modelo interno simples.
- Tratar erros de quota, key invalida, rede e resposta incompleta.

Modelo interno sugerido:

```ts
type YoutubeVideoResult = {
  videoId: string
  url: string
  title: string
  channelTitle: string
  channelId?: string
  description?: string
  thumbnailUrl?: string
  publishedAt?: string
  durationIso?: string
  durationSeconds?: number
  viewCount?: number
  liveBroadcastContent?: "none" | "live" | "upcoming"
}
```

### `youtube-url.ts`

Responsabilidades:

- Gerar URL canonica `https://www.youtube.com/watch?v=<videoId>`.
- Aceitar colagem de URL em vez de busca textual.
- Extrair video id de `youtube.com/watch`, `youtu.be`, `shorts` e `embed`.

### Persistencia local

`host.data.json`:

- preferencias e API key.

`host.data.sqlite` opcional:

- historico de buscas.
- resultados recentes cacheados por poucos dias.
- videos adicionados recentemente para evitar duplicatas visuais.

Nao armazenar copia de video/audio. Cachear apenas metadados necessarios para UX, respeitando as politicas da API.

## Integracao com Lumen

### APIs existentes/planejadas

Usar quando disponivel:

```ts
await host.queue.addUrl?.({
  url: "https://www.youtube.com/watch?v=VIDEO_ID",
  position: "end",
})

await host.queue.addUrl?.({
  url: "https://www.youtube.com/watch?v=VIDEO_ID",
  position: "next",
})

await host.library.addUrl?.({
  type: "video",
  url: "https://www.youtube.com/watch?v=VIDEO_ID",
  addToQueue: true,
})
```

Se a versao instalada da SDK ainda nao tipar essas APIs, usar cast temporario e registrar no plano de SDK a adicao definitiva.

### Request via Lumen host

O modulo nao deve depender de `fetch()` direto no renderer como contrato principal. A SDK deve expor uma API generica `host.net.request()`, implementada pelo Lumen em Rust/Tauri, para que o modulo peca um request e receba a resposta normalizada.

Fluxo desejado:

```txt
YouTube module
  -> host.net.request({ url, method, query, headers, body })
  -> Tauri command
  -> Rust valida permissao de rede do modulo
  -> Rust executa HTTP request
  -> SDK devolve status, headers e data
```

Exemplo de uso para busca:

```ts
const search = await host.net.get<YoutubeSearchResponse>(
  "https://www.googleapis.com/youtube/v3/search",
  {
    query: {
      part: "snippet",
      type: "video",
      q,
      key: apiKey,
      maxResults: 10,
      safeSearch: "moderate",
    },
  }
)
```

O manifesto do modulo deve declarar permissao de rede apenas para os hosts necessarios:

```json
{
  "permissions": {
    "network": [
      "https://www.googleapis.com/youtube/v3/*"
    ]
  }
}
```

A arquitetura detalhada fica no repo do Lumen em `docs/architecture/module-net-request-api.md`.

Importante: no estado atual, `host.net` existe no host interno do Lumen, mas ainda nao esta exposto na SDK publica `@lumen-media/module-sdk`. Antes do modulo depender disso, a SDK precisa receber `NetAPI` e o Lumen precisa implementar a ponte Rust/Tauri.

Tarefa obrigatoria antes da implementacao do modulo: atualizar o repo `Lumen-media/module-sdk` com os tipos `NetAPI`/`NetRequest`/`NetResponse`, adicionar `net` em `LumenHost`, adicionar `permissions.network` no schema do manifest e publicar/consumir uma nova versao da SDK.

### APIs que talvez precisem nascer no Lumen
Para uma experiencia completa, o host pode precisar expor:

```ts
host.youtube.search?(input): Promise<YoutubeSearchPage>
host.youtube.getVideo?(videoId): Promise<YoutubeVideoDetails>
host.media.previewUrl?(url): Promise<void>
host.library.addUrl?(input): Promise<LibraryItem>
host.queue.addUrl?(input): Promise<void>
```

A decisao inicial para credenciais e:

1. O modulo nao traz chave propria e nao usa chaves do desenvolvedor por padrao.
2. Cada cliente/usuario configura a propria Google API key apos instalar o modulo.
3. O MVP salva a chave com `host.data.json`, com UI clara de configuracao.
4. Quando existir `host.secrets`, migrar a chave para armazenamento seguro do Lumen.
5. A camada `youtube-api.ts` deve ficar isolada para permitir trocar `host.net` por `host.youtube.search` no futuro, se o Lumen ganhar um servico especifico.

## Plano por fases

### Fase 0 - Alinhar contrato

- Confirmar se o foco e busca para apresentacao/culto/evento, e nao consumo geral.
- Confirmar acao padrao do Enter: adicionar a fila, adicionar proximo ou abrir detalhes.
- Confirmar se playlists entram no primeiro ciclo ou ficam para depois.
- Atualizar SDK/app se `host.queue.addUrl` e `host.library.addUrl` ainda estiverem parciais.

### Fase 1 - MVP funcional

- Tela Commander app com busca manual.
- Configuracao da API key por engrenagem dentro do Commander app.
- Chamada `search.list` + `videos.list`.
- Renderizacao de resultados com thumbnail e metadados principais.
- Acoes: add to queue, add next, add to library, open external/copy URL.
- Estados de loading, empty, erro e quota.

### Fase 2 - Fluxo rapido

- Prefixo `youtube`/`yt` na command palette.
- Historico de buscas recentes.
- Cache curto de resultados para evitar gastar quota enquanto digita e volta.
- Debounce e cancelamento de requests.
- Colar URL direto no campo para resolver/adicionar video sem chamar search.

### Fase 3 - UX de producao

- Detalhes do video antes de adicionar.
- Filtros: duracao, order, live/upcoming, region/language.
- Indicador se video ja esta na fila/biblioteca.
- Melhor tratamento de videos indisponiveis/nao embeddable quando a API/host conseguir detectar.
- i18n completo pt-BR/en.

### Fase 4 - Host services

- Mover credenciais sensiveis para uma API de secrets do host, se existir.
- Considerar `host.youtube.search` para centralizar quota, cache e erros.
- Expor `host.media.previewUrl` se preview direto ficar importante.
- Fortalecer `host.library.addUrl` para retornar item criado e metadados.

### Fase 5 - Download, se for viavel

So seguir esta fase se houver uma base legal e tecnica clara.

- Definir escopo permitido: conteudo proprio, autorizado, ou aprovacao previa do YouTube.
- Implementar no Lumen host, nao no modulo.
- Expor API de SDK pequena, por exemplo `host.media.downloadUrl`, com status/progresso/cancelamento.
- Persistir status no modelo de URL media ja planejado pelo Lumen.
- Nunca depender de binario externo dentro do modulo.
- Documentar claramente limites, erros e responsabilidades do usuario.

## Riscos e cuidados

- Quota: `search.list` custa caro o bastante para exigir debounce, cache e paginacao cuidadosa. `videos.list` deve buscar detalhes em lote por ids.
- API key: nao embutir segredo no codigo. O cliente/usuario deve informar a propria chave; depois, migrar para `host.secrets` quando existir.
- Networking: usar `host.net.request` Rust-backed quando disponivel, com permissao de rede no manifesto. Evitar depender de `fetch()` direto como contrato permanente.
- Politicas do YouTube: evitar qualquer download/offline playback sem base explicita.
- UX: resultados da API nao sao necessariamente identicos ao site do YouTube. A busca deve parecer familiar, mas nao prometer paridade perfeita.
- SDK parcial: algumas APIs de library/queue por URL podem estar opcionais; o modulo deve degradar com mensagem clara.

## Primeiro pacote de implementacao sugerido

1. Renomear/ajustar manifest para identidade real do modulo.
2. Criar camada `youtube-api.ts` com tipos e normalizacao.
3. Criar `YoutubeCommanderApp` com campo de busca e lista.
4. Persistir API key/preferencias em `host.data.json` e expor configuracao por engrenagem no Commander app.
5. Integrar acoes com `host.queue.addUrl` e `host.library.addUrl`.
6. Adicionar prefixo `youtube` para busca rapida.
7. Validar build/pack do modulo.

## Perguntas em aberto

- O Enter no resultado deve tocar agora, adicionar no fim da fila, adicionar como proximo, ou abrir detalhes?
- O modulo deve aceitar playlists no MVP ou apenas videos individuais?
- Quando `host.secrets` existir, qual sera o fluxo de migracao da API key salva em `host.data.json`?
- O Lumen deve ter uma tela central de credenciais/servicos conectados para modulos?
- Download e realmente requisito de produto, ou a necessidade principal e deixar videos prontos na fila com reproducao online?

