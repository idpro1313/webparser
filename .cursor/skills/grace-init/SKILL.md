---
name: grace-init
description: Bootstrap GRACE framework structure for a new project. Use when starting a new project with GRACE methodology - creates docs/ directory, AGENTS.md, and XML templates for requirements, technology, development plan, verification plan, knowledge graph, and operational packet contracts.
---

Initialize GRACE framework structure for this project.

## Template Files

All documents MUST be created from template files. Resolve `TEMPLATE_ROOT` in this order:
1. `.cursor/grace/templates/docs/`
2. `.kilo/grace/templates/docs/`
3. `.opencode/grace/templates/docs/`
4. `assets/templates/docs/` when this skill is installed with local bundled assets
5. `templates/docs/` when working inside the canonical source package

Read each template file, replace the `$PLACEHOLDER` variables with actual values gathered from the user, and write the result to the target project path.

| Template source                          | Target in project           |
|------------------------------------------|-----------------------------|
| `TEMPLATE_ROOT/AGENTS.md.template`              | `AGENTS.md` (project root)  |
| `TEMPLATE_ROOT/knowledge-graph.xml.template` | `docs/knowledge-graph.xml`  |
| `TEMPLATE_ROOT/requirements.xml.template`    | `docs/requirements.xml`     |
| `TEMPLATE_ROOT/technology.xml.template`      | `docs/technology.xml`       |
| `TEMPLATE_ROOT/development-plan.xml.template`| `docs/development-plan.xml` |
| `TEMPLATE_ROOT/verification-plan.xml.template`| `docs/verification-plan.xml` |
| `TEMPLATE_ROOT/operational-packets.xml.template`| `docs/operational-packets.xml` |

Optional handoff/report templates:

| Template source                          | Target in project           |
|------------------------------------------|-----------------------------|
| `TEMPLATE_ROOT/document-protocol.md.template` | `docs/document-protocol.md` |
| `TEMPLATE_ROOT/reviewer-report.md.template` | `docs/reviewer-report.md` |
| `TEMPLATE_ROOT/verification-report.md.template` | `docs/verification-report.md` |

Copy these optional templates when the project uses standalone handoffs, review reports, verification reports, or mixed-data document protocols.

> **Important:** Never hardcode template content inline. Always read from the `.template` files — they are the single source of truth for document structure.

## Steps

1. **Gather project info from the user.** Ask for:
   - Project name and short annotation
   - Main keywords (for domain activation)
   - Primary language, runtime, and framework (with versions)
   - Key libraries/dependencies (if known)
   - Testing stack (test runner, assertion style, mock/fake approach)
   - Observability stack (logger, structured log fields, redaction constraints)
   - Branch observability policy: for critical modules, confirm that important if/else and error paths will get distinguishable markers in prod and tests (`rules/grace-logging.md`)
   - High-level module list (if known)
   - 2-5 critical flows or risky surfaces that must be verifiable early

2. **Create `docs/` directory and populate documents from templates:**

    For each `TEMPLATE_ROOT/*.xml.template` file:
    - Read the template file
   - Replace `$PLACEHOLDER` variables with user-provided values
   - Write the result to the corresponding `docs/` path

3. **Create or verify `AGENTS.md` at project root:**
    - If `AGENTS.md` does not exist — read `TEMPLATE_ROOT/AGENTS.md.template`, fill in `$KEYWORDS` and `$ANNOTATION`, and write to project root
    - If `AGENTS.md` already exists — warn the user and ask whether to overwrite or keep the existing one

4. **Offer optional handoff/report templates when useful:**
   - If the project will use standalone document protocols, copy `TEMPLATE_ROOT/document-protocol.md.template` to `docs/document-protocol.md`
   - If the project will use repeatable review or verification reports, copy `TEMPLATE_ROOT/reviewer-report.md.template` and `TEMPLATE_ROOT/verification-report.md.template` to `docs/`

5. **Print a summary** of all created files and suggest the next step:
    > "Run `$grace-plan` to design modules, data flows, and verification references. Capture **per-branch** log markers for critical flows in `docs/development-plan.xml`, `docs/technology.xml`, and `docs/verification-plan.xml`. Then use `$grace-verification` to deepen tests, traces, and log-driven evidence before large execution waves. Use `docs/operational-packets.xml` as the canonical packet and delta reference during execution and refactors."
