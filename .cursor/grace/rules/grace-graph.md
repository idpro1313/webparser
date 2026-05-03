# GRACE Knowledge Graph Rules

`docs/knowledge-graph.xml` is the canonical public map of a GRACE project.

## What the Graph Contains

The graph records:

- modules;
- public module purpose;
- source paths;
- public exports/types/classes/functions;
- public dependencies;
- verification refs;
- CrossLinks between modules.

The graph does not record every private helper or local implementation detail.

## Verification and branch observability

`<verification-ref>` links each public module to its `V-M-xxx` entry in `docs/verification-plan.xml`. That entry should name scenarios and **required/forbidden log markers** so another agent can tell which control-flow branches executed in production or tests. The graph alone lists *where* code lives; the verification plan and `rules/grace-logging.md` define *how* branch coverage stays observable.

## Unique Tag Convention

Repeated entities must use their unique ID as the XML tag name.

Use:

```xml
<M-AUTH NAME="Authentication" TYPE="CORE_LOGIC">
  <purpose>Authenticate users and manage sessions.</purpose>
  <path>src/auth/index.ts</path>
  <depends>M-CONFIG, M-DB</depends>
  <verification-ref>V-M-AUTH</verification-ref>
  <annotations>
    <fn-authenticate PURPOSE="Проверяет credentials и создает session" />
    <type-Session PURPOSE="Данные authenticated session" />
  </annotations>
  <CrossLink from="M-AUTH" to="M-DB" relation="queries-db" />
</M-AUTH>
```

Do not use:

```xml
<Module ID="M-AUTH">...</Module>
```

## Common Tag Families

- modules: `<M-XXX>`;
- use cases: `<UC-001>`;
- data flows: `<DF-XXX>`;
- phases: `<Phase-1>`;
- steps: `<step-1>`;
- verification entries: `<V-M-XXX>`;
- functions: `<fn-name>`;
- types: `<type-Name>`;
- classes: `<class-Name>`;
- exports: `<export-name>`.

## CrossLinks

Use self-closing CrossLinks:

```xml
<CrossLink from="M-SOURCE" to="M-TARGET" relation="reads-config" />
```

Rules:

- CrossLinks must match real public dependencies.
- If imports or public module dependencies change, update the graph.
- If a module is removed, remove stale CrossLinks.
- If a public export changes, update annotations.

## Verification Refs

Every important module should point to its verification entry:

```xml
<verification-ref>V-M-AUTH</verification-ref>
```

The graph tells agents where a module lives and what it touches. The verification plan tells agents how to prove it works.

## Maintenance

Update `docs/knowledge-graph.xml` when:

- adding/removing modules;
- changing public module dependencies;
- changing public exports or types;
- moving module paths;
- renaming module IDs;
- changing verification refs.

Use `grace-refresh` or the optional `grace` CLI to detect drift when unsure.
