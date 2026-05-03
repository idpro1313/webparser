# Semantic Markup Convention

Semantic markup в GRACE выполняет двойную функцию: navigation anchors для RAG agents и attention anchors для LLM context management. Markers — не обычные комментарии, а load-bearing structure.

## Module Level (верх файла)

Каждый важный source file должен начинаться с:

```
// FILE: path/to/file.ext
// VERSION: 1.0.0
// START_MODULE_CONTRACT
//   PURPOSE: [Что делает модуль - одно предложение]
//   SCOPE: [Какие операции входят в область ответственности]
//   DEPENDS: [Список зависимостей модуля]
//   LINKS: [Ссылки на узлы knowledge graph]
//   Optional lint metadata, не входит в core 4-field contract:
//   ROLE: [Optional: RUNTIME | TEST | BARREL | CONFIG | TYPES | SCRIPT]
//   MAP_MODE: [Optional: EXPORTS | LOCALS | SUMMARY | NONE]
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   exportedSymbol - краткое описание
// END_MODULE_MAP
```

Адаптируйте comment syntax под язык проекта: `#` для Python, `//` для Go/TS/Java, `--` для SQL.

Существенные test files должны использовать ту же структуру, когда tests — самый быстрый способ для будущих агентов понять behavior, fixtures и expected evidence.

Core file-level `MODULE_CONTRACT` состоит из `PURPOSE`, `SCOPE`, `DEPENDS` и `LINKS`.

Опциональная lint-specific metadata:

- `ROLE` сообщает `grace lint`, какой это тип governed file.
- `MAP_MODE` сообщает `grace lint`, как интерпретировать `MODULE_MAP`.

Рекомендуемые defaults:

- `RUNTIME` + `EXPORTS` для обычных source modules.
- `TEST` + `LOCALS` для существенных test files.
- `BARREL` + `SUMMARY` для re-export aggregators.
- `CONFIG` + `NONE` для tool или build configuration files.
- `TYPES` + `EXPORTS` для чистых type/interface modules.
- `SCRIPT` + `LOCALS` для CLI/bootstrap/smoke scripts.

Правило shared-docs boundary:

- `docs/development-plan.xml` и `docs/knowledge-graph.xml` должны описывать только public contract и public interface module.
- internal helpers, private types и implementation-only orchestration принадлежат file header markup и local function contracts, а не shared XML artifacts.

## Function or Component Level

Каждая exported function/component и каждая critical local function должны иметь contract. Компактное canonical rule находится в `rules/grace-code-markup.md`.

```
// START_CONTRACT: functionName
//   PURPOSE: [Что делает функция/компонент]
//   INPUTS: { paramName: Type - description }
//   OUTPUTS: { ReturnType - description }
//   SIDE_EFFECTS: [Какое внешнее состояние изменяет]
//   LINKS: [Связанные модули/функции через knowledge graph]
// END_CONTRACT: functionName
```

## Code Block Level (внутри functions)

```
// START_BLOCK_VALIDATE_INPUT
// ... code ...
// END_BLOCK_VALIDATE_INPUT
```

## Change Tracking

```
// START_CHANGE_SUMMARY
//   LAST_CHANGE: [v1.2.0 - Что изменилось и почему]
// END_CHANGE_SUMMARY
```

## Granularity Rules

1. Около 500 tokens на block. Слишком большой block ломает locality модели. Слишком маленький превращает markup в noise.
2. Block names должны быть unique внутри файла.
3. У каждого `START_BLOCK_X` должен быть matching `END_BLOCK_X`.
4. Block names описывают ЧТО, а не КАК.

## Logging Convention

Все важные logs должны ссылаться на semantic blocks ради traceability:

```
logger.info(`[ModuleName][functionName][BLOCK_NAME] message`, {
  correlationId,
  stableField: value,
});
```

Это создает прямую связь от runtime logs к source code blocks.

## Test and Trace Guidance

Когда path достаточно критичен для проверки, сведите test и logs в одной точке:

- production code emits stable markers `[Module][function][BLOCK_NAME]` на **каждой значимой ветке** (включая error/early-return ветки), чтобы по логам восстанавливался **фактический** execution path;
- tests сначала проверяют deterministic outcomes;
- tests проверяют markers или trace order, когда trajectory имеет значение — отдельные сценарии на разные ветки, при необходимости **forbidden** markers для «не должно было зайти сюда»;
- verification docs фиксируют, какие markers обязательны для каждого сценария (`required-log-markers`, порядок).

Пример:

```ts
expect(hasLogMarker("info", "[ChatDomain][createChat][BLOCK_INSERT_CHAT]")).toBe(true);
```

## Rules

1. Не удаляйте semantic markup anchors без необходимости.
2. При редактировании кода сохраняйте block boundaries, если изменение действительно не требует restructuring.
3. Если block перерастает working window, разделите его на sub-blocks.
4. Если переименовали block, обновите все log references и связанные verification entries.
5. `MODULE_MAP` должен соответствовать lint mode файла:
   - `EXPORTS` => отражает public exports;
   - `LOCALS` => отражает важные local helpers, fixtures или entry points;
   - `SUMMARY` => summarizes grouped surfaces без перечисления каждого symbol;
   - `NONE` => omit `MODULE_MAP`, если file role действительно не требует карты.
6. Shared XML artifacts не должны механически зеркалить весь file header. Там должны быть только public module-facing contract и interface details.
