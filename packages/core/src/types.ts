// START_MODULE_CONTRACT
// PURPOSE: Shared domain types for parse output and orchestration outcomes.
// SCOPE: Result shapes only; no I/O here.
// DEPENDS: none.
// LINKS: M-JOB-ORCHESTRATOR, M-AI-ADAPTER.
// ROLE: TYPES.
// MAP_MODE: EXPORTS.
// END_MODULE_CONTRACT

export interface StructuredSelection {
  summary: string;
  keyFacts: string[];
  structuredSections?: Array<{ heading: string; body: string }>;
}

export interface ExtractedDocument {
  title: string;
  mainText: string;
  headings: string[];
  languageHint?: string;
}

export type ParseJobOutcome =
  | {
      ok: true;
      outputRelativeDir: string;
      relativeFiles: string[];
    }
  | {
      ok: false;
      code: string;
      message: string;
      partialOutputs?: string[];
    };
