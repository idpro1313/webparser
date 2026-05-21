# Grace 2.0 для Kilo Code

## Содержимое

- `rules/rules.md` — центральный диспетчер (фазы, шаблон кода, LDD)
- `rules/agent-rules.md` — ops: журнал, обязательные `docs/*`, git/VERSION
- `skill/*/SKILL.md` — протоколы и режимы
- `agents/grok_searcher.md` — семантический grep-сканер
- `mcp.json` — MCP-серверы (по умолчанию пусто)

В корне шаблона также лежат `kilo.json` (права CLI) и `kilo.jsonc` (`instructions` → `.kilocode/rules/*.md`).
