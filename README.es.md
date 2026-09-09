# YouTube para Lumen

Busca en YouTube sin salir de [Lumen](https://github.com/Lumen-media/lumen). Encuentra el video, previsualízalo y envíalo a tu cola, a tu biblioteca o directo a la pantalla — todo desde la paleta de comandos.

<img width="776" height="504" alt="Búsqueda de YouTube en el Commander" src="https://github.com/user-attachments/assets/f7b3ee47-bb12-453b-93db-912af881e3e8" />

## Lo que hace por ti

- **Búsqueda instantánea** — Escribe una consulta en el Commander y obtén resultados rápido, sin necesidad del navegador.
- **Reprodúcelo a tu manera** — Reproduce ahora, añade al final de la cola, añade como siguiente o guarda en la biblioteca con una sola tecla.
- **Sin configuración previa** — Funciona de inmediato; una clave de API de Google opcional desbloquea un filtrado regional y de idioma más preciso.
- **Respaldo inteligente** — Cambia automáticamente entre la API de Google y las fuentes Invidious sin clave cuando se agota la cuota.
- **Pega y listo** — Pega un enlace `youtube.com`, `youtu.be`, `shorts` o `embed` en el campo de búsqueda para resolverlo al instante.
- **Tu pantalla, tu idioma** — Búsqueda segura, cantidad de resultados, región y preferencias de idioma en Configuración.

## Inicio rápido

1. Instala el módulo en Lumen (**Configuración → Módulos → Instalar módulo**) y selecciona el `.lumenpack` de la última versión.
2. Abre la paleta de comandos (`Ctrl+Shift+P`) y ejecuta `YouTube: Search`.
3. Escribe para buscar. Selecciona un resultado y usa:

| Tecla | Acción |
|---|---|
| `Enter` | Reproducir ahora |
| `Q` | Añadir a la cola (final) |
| `N` | Añadir como siguiente |
| `L` | Añadir a la biblioteca |
| `O` | Abrir en YouTube |
| `Y` | Copiar URL |

## Aún más rápido

Escribe `youtube <búsqueda>` o `yt <búsqueda>` directamente en la paleta de comandos para omitir el módulo:

| Prefijo | Ejemplo |
|---|---|
| `youtube` | `youtube hillsong oceans` |
| `yt` | `yt tudo posso` |

## Para usuarios avanzados

- Pega una URL de YouTube en el campo de búsqueda para resolverla al instante.
- En **Configuración** (icono de engranaje), elige la fuente de búsqueda, región, idioma, búsqueda segura y acción predeterminada.
- Añade una clave de API de Google para resultados precisos y filtrado regional — opcional, el módulo funciona sin ella.

---

Hecho para la plataforma [Lumen](https://github.com/Lumen-media/lumen). Licencia MIT — consulta [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) para detalles técnicos.

Desarrollado con [Invidious API](https://docs.invidious.io/api/) — usa instancias públicas de Invidious para búsqueda ilimitada de YouTube sin clave.