# YouTube para Lumen

Pesquise no YouTube sem sair do [Lumen](https://github.com/Lumen-media/lumen). Encontre o vídeo, pré-visualize e envie para a fila, para a biblioteca ou direto para a tela — tudo pela paleta de comandos.

<img width="776" height="504" alt="Busca de YouTube no Commander" src="https://github.com/user-attachments/assets/f7b3ee47-bb12-453b-93db-912af881e3e8" />

## O que ele faz por você

- **Busca instantânea** — Digite uma consulta no Commander e receba resultados rápido, sem precisar do navegador.
- **Reproduza do seu jeito** — Toque agora, adicione ao final da fila, adicione como próximo ou salve na biblioteca com um único atalho.
- **Sem configuração necessária** — Funciona de cara; uma chave de API do Google opcional libera filtros regionais e de idioma mais precisos.
- **Fallback inteligente** — Alterna automaticamente entre a API do Google e as fontes Invidious sem chave quando a cota acaba.
- **Cole e vá** — Cole um link `youtube.com`, `youtu.be`, `shorts` ou `embed` no campo de busca para resolver instantaneamente.
- **Sua tela, seu idioma** — Busca segura, quantidade de resultados, região e preferências de idioma nas Configurações.

## Como começar

1. Instale o módulo no Lumen (**Configurações → Módulos → Instalar Módulo**) e selecione o `.lumenpack` da última release.
2. Abra a paleta de comandos (`Ctrl+Shift+P`) e execute `YouTube: Search`.
3. Digite para buscar. Selecione um resultado e use:

| Tecla | Ação |
|---|---|
| `Enter` | Tocar agora |
| `Q` | Adicionar à fila (final) |
| `N` | Adicionar como próximo |
| `L` | Adicionar à biblioteca |
| `O` | Abrir no YouTube |
| `Y` | Copiar URL |

## Ainda mais rápido

Digite `youtube <busca>` ou `yt <busca>` direto na paleta de comandos para pular o módulo:

| Prefixo | Exemplo |
|---|---|
| `youtube` | `youtube hillsong oceans` |
| `yt` | `yt tudo posso` |

## Para usuários avançados

- Cole uma URL do YouTube no campo de busca para resolvê-la instantaneamente.
- Nas **Configurações** (ícone de engrenagem), escolha a fonte de busca, região, idioma, busca segura e ação padrão.
- Adicione uma chave de API do Google para resultados precisos e filtragem regional — opcional, o módulo funciona sem ela.

---

Feito para a plataforma [Lumen](https://github.com/Lumen-media/lumen). Licença MIT — veja [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) para detalhes técnicos.

Desenvolvido com [Invidious API](https://docs.invidious.io/api/) — usa instâncias públicas do Invidious para busca ilimitada de YouTube sem chave.