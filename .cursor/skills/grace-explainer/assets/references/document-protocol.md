# Document Protocol

Используйте GRACE document protocol, когда длинному prompt, markdown-документу, handoff или analysis нужны четкие semantic boundaries, но внутри может быть XML или JSON как данные.

## Зачем Это Нужно

XML — канонический формат для GRACE project artifacts вроде `requirements.xml`, `development-plan.xml` и `knowledge-graph.xml`.

Prompt-like документы отличаются. Они часто содержат XML или JSON examples внутри payload. Если внешняя структура тоже использует XML tags, агенты могут перепутать protocol tags с data tags.

Используйте `$START_*` / `$END_*` markers для структуры prompt/document, чтобы избежать semantic interference.

## Каноническая Форма

```text
$START_DOCUMENT
TITLE: Короткое название документа
PURPOSE: Зачем существует этот документ
SCOPE: Что покрывает этот документ
KEYWORDS: Доменные термины, которые должны активировать модель
$END_DOCUMENT

$START_DOCUMENT_PLAN
- SECTION: Что будет покрыто
- SECTION: Какие evidence или examples включены
$END_DOCUMENT_PLAN

$START_SECTION_NAME
Здесь находится содержимое.
$END_SECTION_NAME

$START_DATA
Здесь могут находиться raw XML, JSON, logs, SQL или code samples.
$END_DATA

$START_OUTPUT_CONTRACT
Ожидаемая форма output, acceptance criteria или review checklist.
$END_OUTPUT_CONTRACT
```

## Правила

- Используйте all-caps semantic marker names.
- Для каждого `$START_*` должен быть matching `$END_*`.
- Держите каждую section сфокусированной на одной идее.
- Размещайте document plan ближе к началу для first-frame priming.
- Помещайте raw XML/JSON/log data внутрь `$START_DATA` / `$END_DATA`.
- Не используйте `$START/$END` как замену canonical XML project artifacts.

## Связь с GRACE Artifacts

- Используйте XML для persisted project truth.
- Используйте `$START/$END` для prompt-like, markdown-like или mixed-data documents.
- Используйте code comments (`START_BLOCK_*`) для source code semantic blocks.
