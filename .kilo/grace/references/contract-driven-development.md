# Contract-Driven Development

В GRACE контракт является источником истины. Код реализует контракт, а не наоборот.

## Правило

**Никогда не пишите код без контракта.** Перед генерацией или редактированием любого управляемого source-файла создайте или обновите file-level `MODULE_CONTRACT` с полями `PURPOSE`, `SCOPE`, `DEPENDS` и `LINKS`. Function contracts содержат `PURPOSE`, `INPUTS`, `OUTPUTS`, `SIDE_EFFECTS` и `LINKS`; strict/high-risk поля опциональны и описаны в `rules/grace-code-markup.md`. Plan-level module contracts хранят публичные inputs, outputs и errors.

## MODULE_CONTRACT

Каждый файл начинается с:

```
// START_MODULE_CONTRACT
//   PURPOSE: [Что делает модуль - одно предложение]
//   SCOPE: [Какие операции входят в область ответственности]
//   DEPENDS: [Список зависимостей модуля по M-xxx ID]
//   LINKS: [Ссылки на узлы knowledge graph]
// END_MODULE_CONTRACT
```

Контракт пишется до кода. Он берется из development plan (`docs/development-plan.xml`), который пользователь утвердил на фазе `$grace-plan`.

Именуйте сущности семантически. Контракт намного сильнее, когда module names, текст `PURPOSE` и block labels уже кодируют целевое преобразование, а не заставляют агента выводить смысл из абстрактных placeholders.

Важное различие:
- shared XML artifacts содержат публичный контракт модуля и его public interface;
- private helpers, internal normalization steps и implementation-only types остаются в source file header и local contracts.

## Function Contracts

Каждая exported function или component должна иметь:

```
// START_CONTRACT: functionName
//   PURPOSE: [Что делает функция - одно предложение]
//   INPUTS: { paramName: Type — description }
//   OUTPUTS: { ReturnType — description }
//   SIDE_EFFECTS: [Какое внешнее состояние изменяет или "нет"]
//   LINKS: [Связанные модули/функции через knowledge graph]
// END_CONTRACT: functionName
```

## Development Flow

```
Requirements (docs/requirements.xml)
  -> Architecture (docs/development-plan.xml)
    -> Verification plan (docs/verification-plan.xml)
      -> Module Contracts (MODULE_CONTRACT in each file)
        -> Function Contracts (START_CONTRACT in each function)
          -> Code and tests (within semantic blocks)
```

Не перепрыгивайте уровни. Если requirements неясны, остановитесь и уточните их у пользователя.

## Governed Autonomy (PCAM)

PCAM = Purpose, Constraints, Autonomy, Metrics.

- **Purpose**: определяется контрактом. Вы знаете, ЧТО нужно построить.
- **Constraints**: определяются development plan и knowledge graph. Вы знаете ГРАНИЦЫ.
- **Autonomy**: вы выбираете, КАК реализовать задачу внутри этих границ.
- **Metrics**: `OUTPUTS` из контракта плюс verification evidence показывают, завершена ли работа.

У вас есть свобода в том, КАК реализовать, но не в том, ЧТО строить. Контракт и knowledge graph определяют ЧТО. Если контракт кажется неправильным, предложите изменение, но не отклоняйтесь молча.

## Contract Modification Rules

1. **Read before edit** — всегда читайте `MODULE_CONTRACT` перед редактированием файла.
2. **Update MODULE_MAP** — если меняете релевантные public или local symbols для lint mode файла, обновите `MODULE_MAP`.
3. **Update knowledge graph** — если добавляете/удаляете modules, dependencies или public module interface surface, обновите `docs/knowledge-graph.xml`.
4. **Update verification plan** — если меняете tests, required markers, verification commands или **значимые ветвления** (новые else/error/early-return пути), обновите сценарии и `required-log-markers` в `docs/verification-plan.xml`; см. `rules/grace-logging.md`.
5. **Track changes** — после bug fix добавьте запись `CHANGE_SUMMARY`.
6. **Never remove markup** — semantic markup anchors являются load-bearing structure.
7. **Propose, don't deviate** — если контракт неправильный, предложите изменение пользователю. Не реализуйте другой замысел молча.
8. **Anchor the intent** — предпочитайте meaningful names и конкретный текст `PURPOSE` вместо generic placeholders или произвольных IDs.

## Contract в development-plan.xml

Modules в development plan хранят контракт в XML:

```xml
<M-AUTH NAME="Authentication" TYPE="CORE_LOGIC" LAYER="2" ORDER="1">
  <contract>
    <purpose>Обрабатывает user authentication и session management</purpose>
    <inputs>
      <param name="credentials" type="Credentials" />
    </inputs>
    <outputs>
      <param name="session" type="Session" />
    </outputs>
    <errors>
      <error code="AUTH_FAILED" />
      <error code="SESSION_EXPIRED" />
    </errors>
  </contract>
  <interface>
    <export-authenticate PURPOSE="Проверяет credentials и создает session" />
    <export-validateSession PURPOSE="Проверяет, что session еще валидна" />
    <export-logout PURPOSE="Удаляет active session" />
  </interface>
  <depends>M-CONFIG, M-DB</depends>
</M-AUTH>
```

Этот XML contract является blueprint для `MODULE_CONTRACT` в source-файле. Соответствующая verification entry в `docs/verification-plan.xml` является blueprint того, как модуль доказывает, что все еще удовлетворяет контракту.

Shared XML contract должен оставаться на уровне module boundary. Он не должен перечислять каждый private helper, который существует только для поддержки реализации. Такие детали принадлежат file header и local contracts.
