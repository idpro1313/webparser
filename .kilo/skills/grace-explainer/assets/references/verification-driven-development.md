# Verification-Driven Development

В GRACE verification — не послесловие. Это поддерживаемый architectural artifact.

## Ключевая Идея

`docs/verification-plan.xml` отвечает на вопрос:

"Как другой агент докажет, что этот module или flow все еще корректен?"

У такого доказательства три слоя:

1. deterministic assertions для точных outcomes;
2. trace или log assertions для execution trajectory;
3. phase-level или integration checks для merged surfaces.

Для длинных autonomous runs verification также является autonomy gate. Она должна доказывать, что другой агент сможет продолжить или отладить работу по visible evidence, а не по hidden reasoning.

## Структура Verification Plan

Типовые sections:

- `GlobalPolicy` - project-wide log format, redaction rules и verification levels;
- `CriticalFlows` - high-risk product paths, которые должны оставаться observable;
- `ModuleVerification` - одна entry `V-M-xxx` на важный module;
- `PhaseGates` - более широкие checks, необходимые перед завершением phase.

## Module Verification Entry

Пример:

```xml
<V-M-CHATS MODULE="M-CHATS" PRIORITY="high">
  <test-files>
    <file>apps/server/src/chat/index.test.ts</file>
  </test-files>
  <module-checks>
    <check-1>bun test apps/server/src/chat/index.test.ts</check-1>
  </module-checks>
  <scenarios>
    <scenario-1 kind="success">Generated title назначается только если chat все еще без title.</scenario-1>
    <scenario-2 kind="failure">Ownership failure отклоняет mutation.</scenario-2>
  </scenarios>
  <required-log-markers>
    <marker-1>[ChatDomain][setGeneratedTitleIfEmpty][BLOCK_ASSIGN_GENERATED_TITLE]</marker-1>
  </required-log-markers>
</V-M-CHATS>
```

## Разметка ветвлений и восстановление пути выполнения

Концепция GRACE требует не только правильного **результата**, но и доказуемого **пути**: какая ветка алгоритма реально отработала в **тестах и в продакшне**, чтобы ИИ-агент (или человек) мог сопоставить runtime с контрактом и сценарием verification.

**Зачем.** Два разных execution path могут дать одинаковый внешний outcome. Без маркеров на ветках агент видит «зелёный» тест или «200 OK», но не знает, сработала ли защита, сработал ли fallback, был ли short-circuit или альтернативный бизнес-путь. Логи при этом должны быть **полным следом ветвлений** для управляемого модуля: не декоративные сообщения, а **стабильные якоря** на каждое значимое решение.

**Что помечать логами**

- Ветки, где меняется **поведение**, **побочные эффекты**, **инварианты**, **режим ошибки** или **безопасность**.
- Все **взаимоисключающие** руки `if / else if / else`, `switch`, pattern matching: у каждой руки, достижимой в проде, должен быть **отличимый** marker или одна строка с **стабильным полем** (`branch`, `outcome`, `reasonCode` и т.д.) с несовпадающими значениями по рукам.
- **Ранние выходы** и guard clauses: отказ в валидации, отсутствие прав, not-found, «пропустить шаг» — так же, как основной поток.
- Там, где важны **повторы, таймауты, отмена**, фиксировать, какая ветка победила.

**Уровень детализации и шум**

- На **критичных и высокоавтономных** потоках (деньги, персональные данные, безопасность, необратимые записи, внешние API) — стремиться к **почти полной** разметке ветвлений внутри governed function/flow. Отсутствие marker на достижимой ветке — дефект observability и повод обновить `verification-plan.xml` и тесты.
- На вспомогательном коде допустим меньший объём, но любой узел на критическом пути наследует более строгий tier.

**Связь с verification**

- Для каждого сценария в `docs/verification-plan.xml` задавайте набор **required** и при необходимости **forbidden** markers и порядок, если порядок различает ветки.
- Один сценарий теста — одна ожидаемая **траектория**; другие ветки должны иметь отдельные сценарии или явные negative cases.
- Маркеры в коде, в плане и в assert'ах должны совпадать по стабильным строкам/полям в **тесте и продакшне** (одна каноническая форма evidence).

Канонические правила формата и анти-паттерны: `rules/grace-logging.md` (секция про branching / control-flow observability).

## Log-Driven Development

Логи — это evidence, а не декоративные сообщения.

Хорошие GRACE logs:

- связаны с semantic blocks;
- структурированы stable fields;
- безопасны для хранения и inspection;
- достаточно точны, чтобы будущий агент мог вернуться к source block или failing scenario.

Пример:

```ts
logger.info("[ChatDomain][createChat][BLOCK_INSERT_CHAT] Chat created", {
  chatId,
  userId,
  correlationId,
});
```

## Правила Test Design

1. Сначала deterministic assertions.
2. Добавляйте trace или log assertions, когда plain return-value check недостаточно.
3. Каждая **важная ветка** (альтернативный happy path, error path, early return) получает свой сценарий в `verification-plan.xml` и свой набор **required** / при необходимости **forbidden** markers в тестах; не смешивайте ожидаемую траекторию разных веток в одном сценарии без явной фиксации markers.
4. Держите module-local tests рядом с module, когда это практично.
5. Используйте narrow fakes и stubs вместо больших opaque mocks.
6. Если bug прошел наружу, перед закрытием цикла усилите nearby verification entry и tests.

## Execution Levels

- **Module level**: быстрые checks, которые worker может запустить сам.
- **Wave level**: checks только для merged surfaces, затронутых в wave.
- **Phase level**: более широкие regression и integrity gates.

Execution packets в `grace-execute` и `grace-multiagent-execute` должны переиспользовать эти уровни вместо ad hoc изобретения новых checks.

## Autonomy Gate

Перед отправкой module в более длинный autonomous run проверьте:

1. для module существует entry `V-M-xxx`;
2. есть хотя бы одна module-local command;
3. success и failure scenarios названы;
4. required log markers или trace assertions делают divergence observable;
5. wave-level или phase-level follow-up назван, когда module-local checks недостаточно;
6. operational packets или checkpoint reports фиксируют assumptions, stop conditions и next action.

## Failure Packets

Когда verification fails, зафиксируйте:

- scenario, который упал;
- expected evidence;
- observed evidence;
- first divergent function или block;
- next suggested action.

Это делает `grace-fix` быстрее и менее lossy.
