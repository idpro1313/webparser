# LLM Mechanics to GRACE Rules

Purpose: превратить механику из книги в engineering rules для финального пакета GRACE. Этот документ не пересказывает книгу; это trace от model behavior к package decisions.

## Core Mapping

| LLM mechanic | Practical risk | GRACE rule | Package surface |
|---|---|---|---|
| Tokens and embeddings activate semantic neighborhoods. | Generic names и vague prompts активируют широкие average patterns. | Используйте domain-rich names, `KEYWORDS`, concrete `PURPOSE` и explicit `LINKS`. | `grace-explainer`, `grace-plan`, `rules/grace-core.md`, code templates. |
| Causal reading locks early context into later generation. | Неверный first frame смещает все дальнейшее reasoning, и это трудно откатить. | Ставьте graph, role, constraints и contract перед task execution. | `AGENTS.md.template`, `grace-plan`, `ExecutionPacket`. |
| Attention sinks and anchors stabilize attention around early unique tokens. | Long context становится нестабильным без explicit anchors. | Загружайте `docs/knowledge-graph.xml` рано; используйте unique module tags и semantic block markers. | `knowledge-graph.xml.template`, `rules/grace-graph.md`. |
| Lost in the Middle weakens retrieval from the middle of long contexts. | Critical details в середине забываются или неверно paraphrase. | Делите docs/code на bounded sections; дублируйте critical constraints в graph, packet и verification entry. | `development-plan.xml`, `operational-packets.xml`, code markup rules. |
| Sliding window behavior favors small local chunks. | Large files и huge functions ухудшают edit accuracy. | Предпочитайте small modules, explicit file headers и regions `START_BLOCK_*` вокруг важной logic. | `rules/grace-code-markup.md`, code templates. |
| Prompt-as-protocol beats vague instruction. | "Сделай хорошо" дает plausible, но unconstrained output. | Skills и packets должны задавать goal, constraints, output format, evidence и stop conditions. | Все `grace-*` skills, `operational-packets.xml.template`. |
| Structured outputs reduce format drift. | Free-form handoffs теряют fields и создают hidden assumptions. | Используйте XML templates и packet schemas для requirements, plans, verification, deltas, failures и checkpoints. | `GRACE_PACKAGE_ROOT/templates/docs/*.xml.template`. |
| XML/document semantic interference happens when protocol tags and data tags share the same syntax. | Agents путают prompt structure с XML/JSON payloads. | Используйте `$START/$END` для prompt/document protocols, но unique XML tags для GRACE artifacts. | `references/document-protocol.md`, canonical decisions. |
| Superposition helps explore alternatives before committing. | Early collapse создает local-optimum architecture. | Planning должен оценить 2-3 concepts по explicit criteria перед выбором. | `grace-plan`, `rules/grace-core.md`. |
| Agent and chat require different context budgets and tools. | Один giant universal agent смешивает brainstorming, implementation, debug и QA. | Разделяйте GRACE phases: ask/status/init/plan/verification/execute/review/fix/refresh. | Skill set structure. |
| Hidden reasoning is not evidence. | Уверенное объяснение модели может быть faithful-looking facade. | Verification должна опираться на deterministic assertions, logs, traces и named evidence. | `grace-verification`, `verification-plan.xml.template`. |
| Log Driven Development makes execution path observable. | Green tests могут скрывать неправильный execution path; одинаковый результат — разные ветки. | На critical paths размечайте **значимые ветвления** стабильными markers (в prod и tests); assertions проверяют outcome и траекторию. | `rules/grace-logging.md`, `references/verification-driven-development.md`, `grace-verification`. |
| Chain-of-Verification catches self-contradiction. | Generated artifact может нарушать собственный contract. | Review сравнивает contract, code, graph, verification и evidence. | `grace-reviewer`, `grace-fix`. |
| Anti-loop escalation prevents repeated failed fixes. | Agents повторяют одну и ту же fix attempt на фоне context fatigue. | Каждому execution/fix packet нужны retry budget, stop conditions и failure handoff. | `operational-packets.xml.template`, `grace-execute`, `grace-fix`. |
| Zero-Context Survival is required across sessions/agents. | Later agents не видят chat history и выводят неверный intent. | Files несут `MODULE_CONTRACT`, `MODULE_MAP`, `CHANGE_SUMMARY`, local contracts и semantic blocks. | `rules/grace-code-markup.md`, code templates. |
| Tools are better than models for exact operations. | Models ошибаются в вычислениях, подсчетах или hallucinate filesystem/project facts. | Используйте CLI/lint/tests/search tools для exact checks; model judgment считайте bounded и evidence-driven. | `grace-cli`, verification и review skills. |

## Derived Design Rules

### 1. Graph First

Knowledge graph — не documentation after the fact. Это attention scaffold. Его нужно загружать до deep implementation, чтобы module names, dependencies, public interfaces и verification refs стали stable anchors для дальнейшего reasoning.

Канон:

- Используйте `docs/knowledge-graph.xml` как public module map.
- Используйте unique XML tags вроде `<M-AUTH>` и `</M-AUTH>` вместо повторяющихся closings `<Module>`.
- Держите private helpers вне shared graph; private detail принадлежит file-local markup.

### 2. Contract Before Code

LLM генерируют код надежнее, когда intended transformation уже присутствует в immediate context. Contract — не human documentation, а generation prior.

Канон:

- Каждый governed source file начинается с `MODULE_CONTRACT`.
- Каждая exported function/component имеет local contract.
- Implementation следует contract; если contract wrong, execution stops and replans.

### 3. Sectioned Context

Long context нужно делить на semantic regions, чтобы attention не размазывался по несвязанным идеям.

Канон:

- Используйте `START_BLOCK_*` / `END_BLOCK_*` в code для important blocks.
- Используйте `$START_*` / `$END_*` в prompt-like protocols и documents, где может появляться XML payload.
- Используйте XML только для canonical GRACE artifacts, где важны machine parsing и hierarchy.

### 4. Orthogonal Projections

Plan сильнее, когда описывает систему в нескольких views: module graph, data flow, implementation order, verification evidence. Противоречия между projections вскрывают hallucinations.

Канон:

- `development-plan.xml` содержит modules, data flows, implementation order и execution policy.
- `verification-plan.xml` связывает modules/flows с evidence.
- `knowledge-graph.xml` отображает public module boundaries и dependencies.

### 5. Verification Is Architecture

Correctness не может зависеть от hidden reasoning модели. Другой агент должен уметь доказать или отладить behavior по visible artifacts.

Канон:

- Сначала deterministic assertions.
- Trace/log assertions для critical branches и side effects; ветки, меняющие поведение, должны быть **различимы** в логах.
- Failure packets указывают expected evidence, observed evidence, first divergent block и next action.

### 6. Bounded Autonomy

Агентам нужна свобода в implementation, но не свобода переопределять problem.

Канон:

- Execution packets определяют scope, assumptions, stop conditions и retry budget.
- Workers не редактируют shared architecture truth напрямую в multi-agent mode.
- Reviewers сравнивают outputs с packets, contracts, graph deltas и verification evidence.

## Package Implications

1. Runtime skills должны оставаться компактными и procedural. Deep explanations уходят в `references/`.
2. Rules должны фиксировать non-negotiable constraints, а не заново преподавать всю methodology.
3. Templates — самый сильный способ enforce structure; они должны кодировать canonical fields и examples.
4. Финальному пакету нужен и minimal path (`init -> plan -> verification -> execute`), и advanced path (`multiagent-execute`, `refactor`, `refresh`, `cli`).
5. Strict KiloCode ideas должны стать opt-in strictness levels там, где они слишком тяжелы для каждого проекта.
