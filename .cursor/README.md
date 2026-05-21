# Grace 2.0 для Cursor

Скопируйте содержимое **корня** шаблона `_template 2.0` в новый проект. Для Cursor достаточно папки `.cursor/` и общих каталогов проекта (`plans/`, `tests/`, `src/`, `docs/`).

## Что использует Cursor

- `.cursor/rules/grace-2-framework.mdc` — центральный диспетчер Grace 2.0 (`alwaysApply: true`)
- `.cursor/rules/agent-rules.mdc` — ops: `docs/HISTORY`, `plans/ (Grace 2)`, git/VERSION, PowerShell (`alwaysApply: true`)
- `.cursor/skills/<name>/SKILL.md` — 8 skills протоколов и фаз
- `.cursor/agents/grok_searcher.md` — опциональный поисковый субагент

## Skills

`mode-architect`, `mode-code`, `mode-debug`, `mode-qa`, `graph-protocol`, `devplan-protocol`, `document-protocol`, `data-transform`

Перед работой в фазе **обязательно** подключайте соответствующий skill (через UI Cursor или явно в запросе). Действие в фазе без загруженного skill — нарушение протокола (**CRITICAL_RULE_VIOLATION**).

## Workflow

```text
Новая задача → mode-architect → (утверждённый план) → mode-code → mode-debug → mode-qa
```

