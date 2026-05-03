# GRACE Migration Notes

Этот пакет объединяет три implementation variants и исходную книгу GRACE.

## Происхождение Источников

### From `.cursor-marketplace`

Взято как базовая форма пакета:

- Cursor-native `skills/grace/*/SKILL.md`;
- XML document templates;
- operational packets;
- workflows для reviewer/execute/verification/status/fix/refresh/ask;
- public/private split между shared XML docs и file-local markup;
- references по unique XML tag convention.

### From `.kilocode-demo`

Адаптировано в compact rules:

- anchor/contract/log triangle;
- strict contract fields;
- invariants и forbidden changes;
- обработка legacy ambiguity;
- AI-friendly logging checklists;
- language-specific semantic markup examples.

Square-bracket anchor style (`[START_ANCHOR]`) сохранен как legacy context, но не является canonical format для нового кода.

### From `.kilocode-ivanov`

Адаптировано в workflow behavior и references:

- разделение Plan/Code/Debug/QA modes;
- Superposition и Collapse перед architecture commitment;
- SFT priming через docstrings, keywords и links;
- document protocol с `$START/$END`;
- DevPlan orthogonal projections: graph плюс data flow;
- Diagnostic Trio;
- strict LDD marker format;
- anti-loop escalation и `BUG_FIX_CONTEXT`.

### From the Book

Использовано как methodology rationale:

- attention anchors и attention sinks;
- Lost in the Middle;
- causal reading и first-frame bias;
- prompt-as-protocol;
- structured outputs;
- semantic interference;
- различие agent vs chat;
- LDD и semantic trace verification;
- Zero-Context Survival.

## Основные Нормализации

### One code markup grammar

Canonical code использует:

- `START_MODULE_CONTRACT` / `END_MODULE_CONTRACT`;
- `START_MODULE_MAP` / `END_MODULE_MAP`;
- `START_CHANGE_SUMMARY` / `END_CHANGE_SUMMARY`;
- `START_CONTRACT: symbol` / `END_CONTRACT: symbol`;
- `START_BLOCK_NAME` / `END_BLOCK_NAME`.

### One graph artifact

Канонический graph:

```text
docs/knowledge-graph.xml
```

`AppGraph.xml` и `.kilocode/semantic-graph.xml` считаются predecessor names.

### One XML convention

Повторяющиеся XML entities используют unique ID tags:

```xml
<M-AUTH>...</M-AUTH>
<Phase-1>...</Phase-1>
<UC-001>...</UC-001>
```

### Two logging tiers

Default tier:

```text
[Module][function][BLOCK]
```

Strict LDD tier:

```text
[CLASSIFIER][IMP:1-10][FUNCTION][BLOCK][OPERATION]
```

### Strict fields are contextual

Поля вроде `INVARIANTS`, `FORBIDDEN_CHANGES`, `RATIONALE` и `KEYWORDS` mandatory для critical/high-autonomy code, но не для каждого маленького utility file.

## Upgrade Guidance

Для проекта, который использует `.kilocode-demo` rules:

1. Постепенно переименуйте square-bracket anchors в `START_BLOCK_*` / `END_BLOCK_*`.
2. Перенесите graph facts в `docs/knowledge-graph.xml`.
3. Преобразуйте logging rules в default или strict LDD tiers; на critical paths добавьте маркеры на **каждую значимую ветку** (rules/grace-logging.md).
4. Добавьте `docs/verification-plan.xml` перед long execution.

Для проекта, который использует `.kilocode-ivanov` mode skills:

1. Map `mode-architect` to `grace-plan`.
2. Map `mode-code` to `grace-execute`.
3. Map `mode-debug` to `grace-fix`.
4. Map `mode-qa` to `grace-reviewer` and `grace-verification`.
5. Оставьте `$START/$END` для prompt/document protocols, а не для canonical XML artifacts.

Для проекта, который использует `.cursor-marketplace`:

1. Добавьте compact layer `rules/`.
2. Добавляйте strict LDD только там, где риск это оправдывает.
3. Добавьте Superposition и Collapse в planning checkpoints.
4. Добавьте migration notes и LLM mechanics references для maintainers.
