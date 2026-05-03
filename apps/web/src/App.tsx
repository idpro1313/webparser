/* START_MODULE_CONTRACT
   PURPOSE: Lightweight console for submitting parse jobs against the REST API + polling statuses.
   SCOPE: Input URL, enqueue job, view JSON status and MD file listing.
   DEPENDS: browser fetch targeting same-origin `/api`.
   LINKS: M-WEB-UI.
   ROLE: RUNTIME UI.
   MAP_MODE: EXPORT.
   END_MODULE_CONTRACT */

/* START_CONTRACT: App
   PURPOSE: Render UX for smart parse MVP.
   INPUTS: none
   OUTPUTS: React tree
   SIDE_EFFECTS: network calls via fetch()
   LINKS: M-HTTP-API
   END_CONTRACT: App */

import { FormEvent, useEffect, useState } from "react";

interface JobEnvelope {
  jobId: string | null | undefined;
  state: string;
  failedReason?: string | null;
  returnvalue?: unknown;
}

interface FileEnvelope {
  outputDirRelative: string;
  jobState?: string | null | undefined;
  files: Array<{ relativePath: string; type: string }>;
}

export function App() {
  const [url, setUrl] = useState("https://example.com");
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobEnvelope | null>(null);
  const [files, setFiles] = useState<FileEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) {
          throw new Error(`job_status_${res.status}`);
        }
        const body = (await res.json()) as JobEnvelope & { failedReason?: string | null };
        if (!cancelled) setStatus(body);

        const fileRes = await fetch(`/api/jobs/${jobId}/files`);
        if (fileRes.ok && !cancelled) {
          setFiles(await fileRes.json());
        }

        const terminal = ["completed", "failed"].includes(body.state);
        if (!terminal && !cancelled) {
          timer = window.setTimeout(poll, 2500);
        }
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [jobId]);

  const handleSubmit = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    setError(null);
    setStatus(null);
    setFiles(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const bodyText = await res.text();
      if (!res.ok) {
        throw new Error(`${res.status}:${bodyText}`);
      }

      const body = JSON.parse(bodyText) as { jobId: string };

      /* START_BLOCK_SUBMIT_JOB
         outcome recorded for UI QA without verbose logging.
         END_BLOCK_SUBMIT_JOB */
      setJobId(body.jobId);
    } catch (err) {
      setError(`enqueue_failed:${String(err)}`);
    }
  };

  return (
    <main style={{ fontFamily: "system-ui,sans-serif", maxWidth: "960px", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>webparser</h1>
      <p>Укажите URL — worker скачает страницу, извлечёт текст и вызовет OpenAI-compatible API.</p>

      <form onSubmit={(evt) => void handleSubmit(evt)} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ flex: "1 1 320px", padding: "0.5rem" }}
          aria-label="Source URL"
        />
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Parse URL
        </button>
      </form>

      {error && (
        <p style={{ color: "crimson" }} role="alert">
          {error}
        </p>
      )}
      {jobId && (
        <>
          <h2 style={{ marginTop: "1.75rem" }}>Job `{jobId}`</h2>
          <pre>{status ? JSON.stringify(status, null, 2) : "Polling BullMQ …"}</pre>
          <h3>Artifacts</h3>
          <pre>{files ? JSON.stringify(files, null, 2) : "Waiting for Markdown export …"}</pre>
          <small>Фактические Markdown лежат в `OUTPUT_DIR` на сервере (см. README).</small>
        </>
      )}
    </main>
  );
}
