# Шаблоны Кода

Используйте эти файлы как копируемые стартовые точки. Перед применением в проекте замените плейсхолдеры вроде `$MODULE_PATH`, `$MODULE_NAME` и `$VERIFICATION_REF`.

Шаблоны намеренно минимальны. Они показывают каноническую структуру GRACE, но не навязывают строгий LDD и high-risk поля контрактов каждому модулю.

## Шаблоны Модулей

| Язык | Файл | Назначение |
|---|---|---|
| TypeScript | `module.typescript.template` | Скелет типизированного source-модуля. |
| Python | `module.python.template` | Скелет Python source-модуля. |
| JavaScript | `module.javascript.template` | Скелет plain JavaScript source-модуля. |
| Go | `module.go.template` | Скелет Go source-модуля. |
| HTML | `module.html.template` | HTML-оболочка разметки с GRACE-якорями. |
| Java | `module.java.template` | Скелет Java source-модуля. |

HTML-шаблоны используют блочные комментарии для тех же `START_*` / `END_*` якорей, потому что синтаксис разметки не поддерживает line comments.

## Шаблоны Trace-Тестов

Trace-test шаблоны показывают форму assertions: сначала deterministic outcome, затем проверки required и forbidden markers. Один сценарий — одна ожидаемая **траектория**; для других веток заводите отдельные тесты и строки в `docs/verification-plan.xml`. Захват markers зависит от стека и должен быть подключен к logger, test harness, browser runner или trace collector проекта до того, как шаблон станет исполняемым.

Канон политики ветвлений и логов: `rules/grace-logging.md`, `references/verification-driven-development.md`.

TypeScript и JavaScript trace-test шаблоны предполагают runner в стиле Jest/Vitest с `test` и `expect`; адаптируйте эти вызовы, если проект использует другой test stack.

| Язык | Файл | Назначение |
|---|---|---|
| TypeScript | `trace-test.typescript.template` | Outcome плюс assertions по trace markers. |
| Python | `trace-test.python.template` | Outcome плюс assertions по trace markers. |
| JavaScript | `trace-test.javascript.template` | Outcome плюс assertions по trace markers. |
| Go | `trace-test.go.template` | Outcome плюс assertions по trace markers. |
| Java | `trace-test.java.template` | Outcome плюс assertions по trace markers. |

Для HTML нет отдельного trace-test шаблона, потому что HTML verification зависит от выбранного browser, DOM или accessibility test stack.
