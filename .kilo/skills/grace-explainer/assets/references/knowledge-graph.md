# Knowledge Graph Maintenance

Файл `docs/knowledge-graph.xml` — единый источник истины для module structure проекта. Он отображает каждый module, его public interface, dependencies и связи между modules.

## Структура

```xml
<KnowledgeGraph>
  <Project NAME="project-name" VERSION="1.0.0">
    <keywords>keyword1, keyword2, keyword3</keywords>
    <annotation>Краткое описание проекта для LLM domain activation</annotation>

    <M-CONFIG NAME="Config" TYPE="UTILITY" STATUS="implemented">
      <purpose>Application configuration и environment management</purpose>
      <path>src/config/index.ts</path>
      <depends>нет</depends>
      <verification-ref>V-M-CONFIG</verification-ref>
      <annotations>
        <fn-loadConfig PURPOSE="Загружает и валидирует config из environment" />
        <type-AppConfig PURPOSE="Определение типа конфигурации" />
        <export-config PURPOSE="Singleton-экземпляр конфигурации" />
      </annotations>
    </M-CONFIG>

    <M-DB NAME="Database" TYPE="DATA_LAYER">
      <purpose>Database connection и query layer</purpose>
      <path>src/db/index.ts</path>
      <depends>M-CONFIG</depends>
      <annotations>
        <fn-connect PURPOSE="Устанавливает database connection" />
        <fn-query PURPOSE="Выполняет parameterized query" />
        <class-DatabasePool PURPOSE="Менеджер connection pool" />
      </annotations>
      <CrossLink from="M-DB" to="M-CONFIG" relation="reads-config" />
    </M-DB>

  </Project>
</KnowledgeGraph>
```

## Module Tag Convention

Каждый module использует **unique ID как XML tag name**:
- `<M-CONFIG>` not `<Module ID="M-CONFIG">`
- `<M-DB>` not `<Module ID="M-DB">`

Это устраняет closing-tag polysemy: `</M-CONFIG>` однозначен, а множество закрывающих `</Module>` создает для LLM "semantic soup".

## Module Types

| Type | Описание |
|------|-------------|
| ENTRY_POINT | Где начинается execution: CLI, HTTP handler, event listener |
| CORE_LOGIC | Business rules и domain logic |
| DATA_LAYER | Persistence, queries, caching |
| UI_COMPONENT | User interface elements |
| UTILITY | Shared helpers, configuration, logging |
| INTEGRATION | External service adapters |

## Annotation Tags

| Tag | Purpose |
|-----|---------|
| `<fn-name>` | Public function во внешнем contract module |
| `<type-Name>` | Public type/interface, который module предоставляет наружу |
| `<class-Name>` | Public class в module interface |
| `<export-name>` | Public named export: constants, config objects |
| `<const-NAME>` | Public constant |

Не зеркальте каждый private helper из source-файла в `<annotations>`. Private orchestration helpers, local-only utility functions и implementation-only types остаются в module file header и local contracts.

## CrossLinks

CrossLinks — self-closing tags, которые соединяют modules:
```xml
<CrossLink from="M-SOURCE" to="M-TARGET" relation="description" />
```

Частые relations: `reads-config`, `queries-db`, `calls-api`, `renders-component`, `validates-input`.

CrossLinks ОБЯЗАНЫ быть dependency-consistent: если A publicly depends on B, CrossLink должен быть в entry A и совпадать с реальным dependency direction.

Не добавляйте reverse CrossLinks по умолчанию. Добавляйте reverse или non-dependency CrossLink только когда он представляет real public dependency или явно полезную navigation relation.

## Verification References

Modules могут содержать `<verification-ref>`, указывающий на matching entry `V-M-xxx` в `docs/verification-plan.xml`.

Это связывает navigation и proof:
- graph отвечает, где живет module и от чего он зависит;
- verification plan отвечает, как module доказывает correctness, **включая по логам и тестам — какая ветка выполнилась** (сценарии и `required-log-markers`).

Политика разметки ветвлений: `rules/grace-logging.md`, `references/verification-driven-development.md`.

## Maintenance Rules

1. **Always current** — когда добавляете module, добавляйте его в graph. Когда добавляете dependency, добавляйте CrossLink. Не позволяйте graph расходиться с реальностью.
2. **Scan on doubt** — если не уверены, актуален ли graph, запустите `$grace-refresh` для scan и sync.
3. **Version tracking** — увеличивайте Project `VERSION`, когда graph меняется структурно: новые modules, удаленные modules.
4. **Annotations match the public interface** — если public exports module меняются, обновите section `<annotations>`.
5. **Verification refs stay valid** — если verification entry module меняет ID, обновите `<verification-ref>`.
6. **No orphans** — если module удален, удалите его graph entry и все CrossLinks, которые на него ссылаются.
