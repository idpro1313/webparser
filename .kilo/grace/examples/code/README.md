# Примеры Кода

Используйте эти файлы как few-shot примеры для агентов. Это не канонические стартовые шаблоны, их не нужно копировать вслепую.

Примеры могут быть богаче шаблонов. Они могут показывать строгие поля контрактов, strict LDD markers, **различимые маркеры на разных ветках выполнения**, доменные invariants или языковые стили комментариев.

| Язык | Файл | Что показывает |
|---|---|---|
| TypeScript | `module.typescript.example.ts` | Строгие поля контрактов и strict LDD markers. |
| Python | `module.python.example.py` | Строгие поля контрактов, docstring-style context и strict LDD markers. |
| JavaScript | `module.javascript.example.js` | Разметку plain JavaScript/browser bridge. |
| Go | `module.go.example.go` | Go comment syntax, контракты и semantic blocks. |
| HTML | `module.html.example.html` | HTML comment anchors и границы markup blocks. |
| Java | `module.java.example.java` | Строгие поля контрактов и strict LDD markers в Java. |

Когда создаете новый модуль, начинайте с `templates/code/`. Когда нужно показать агенту, как GRACE должен выглядеть на конкретном языке, добавляйте релевантный пример в контекст.
