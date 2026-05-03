# GRACE Core Rules

GRACE is Graph-RAG Anchored Code Engineering: a method for making codebases navigable, verifiable, and maintainable by LLM agents across sessions.

## Non-Negotiable Rules

1. Contract before code.
   Do not create or modify governed implementation without reading or defining the relevant module/function contract.

2. Graph before broad navigation.
   Use `docs/knowledge-graph.xml` to understand modules, dependencies, public interfaces, and verification refs before searching randomly.

3. Plan before execution.
   Large or ambiguous work must pass through requirements, technology, development plan, graph, and verification design before code generation.

4. Verification before autonomy.
   Do not run long autonomous or multi-agent execution when module-local checks, scenarios, log markers, or failure packets are missing.

5. No silent architecture drift.
   If the contract, graph, or verification plan is wrong, stop and replan. Do not quietly implement a different architecture.

6. Separate modes.
   Planning, implementation, debugging, and QA need different context and rules. Do not mix brainstorming and execution in one uncontrolled pass.

7. Use tools for facts.
   Use tests, linters, CLI queries, filesystem inspection, and structured artifacts for exact facts. Model confidence is not evidence.

8. Keep future agents oriented.
   Leave behind contracts, semantic blocks, graph updates, verification refs, and checkpoint/failure packets that another agent can use without chat history.
   On critical paths, production and test logs must be sufficient to reconstruct **which branches ran** (not only the final result), as in `rules/grace-logging.md`.

## Default Workflow

```text
grace-init
  -> grace-plan
    -> grace-verification
      -> grace-execute
        -> grace-reviewer
          -> grace-refresh/status as needed
```

Use `grace-multiagent-execute` only when module ownership is clear and verification is strong enough for parallel workers.

## Stop Conditions

Stop and ask for replan or clarification when:

- requirements contradict the approved contract;
- a new module/dependency is needed but not in the plan;
- verification evidence is too weak to prove the change;
- a worker would need to edit shared artifacts outside controller ownership;
- repeated fixes are consuming retry budget without identifying the first divergent block.

## Provenance

These rules synthesize:

- Cursor GRACE skills and XML templates;
- KiloCode semantic contract/logging rules;
- Ivanov mode protocols and anti-loop workflow;
- the LLM mechanics described in the GRACE source book.
