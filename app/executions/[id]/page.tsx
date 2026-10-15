import Link from "next/link";
import { notFound } from "next/navigation";
import { getExecutionBundle } from "@/lib/execution-db";
import { listExecutionQARuns } from "@/lib/qa-db";
import StartQAPanel from "./start-qa-panel";

export const dynamic = "force-dynamic";

export default async function ExecutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let bundle;
  try {
    bundle = await getExecutionBundle(id);
  } catch {
    bundle = null;
  }

  if (!bundle) notFound();

  const { execution, project, changes, checks, mergeGate, github } = bundle;

  let qaRuns = [];
  try {
    qaRuns = await listExecutionQARuns(execution.id);
  } catch {
    qaRuns = [];
  }

  const canStartQA = ["review_ready", "completed"].includes(execution.status);

  return (
    <main className="workspacePage">
      <header className="workspaceHeader">
        <div>
          <span className="eyebrow">GITHUB EXECUTION / {execution.status.toUpperCase()}</span>
          <h1 className="pageTitle">{project.name}</h1>
          <p className="pageLead">
            {execution.repository} · {execution.workingBranch} → {execution.baseBranch}
          </p>
        </div>
        <Link className="ghostButton" href={`/runs/${execution.runId}`}>Agent Council</Link>
      </header>

      <section className="projectSummaryGrid">
        <article className="summaryCard"><span>Plan Items</span><strong>{execution.plan.items.length}</strong></article>
        <article className="summaryCard"><span>Changes</span><strong>{changes.length}</strong></article>
        <article className="summaryCard"><span>QA Runs</span><strong>{qaRuns.length}</strong></article>
        <article className="summaryCard"><span>Merge Gate</span><strong>{mergeGate.ready ? "READY" : "BLOCKED"}</strong></article>
      </section>

      <section className="detailGrid">
        <article className="detailCard">
          <span className="eyebrow">EXECUTION PLAN</span>
          <p className="briefText">{execution.plan.summary}</p>
          <ol className="cleanList">
            {execution.plan.items.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <span className="inlineMuted"> — {item.rationale}</span>
              </li>
            ))}
          </ol>
        </article>
        <article className="detailCard">
          <span className="eyebrow">GITHUB STATE</span>
          <dl className="executionFacts">
            <div><dt>Repository</dt><dd>{execution.repository}</dd></div>
            <div><dt>Base</dt><dd>{execution.baseBranch}</dd></div>
            <div><dt>Working</dt><dd>{execution.workingBranch}</dd></div>
            <div><dt>Head</dt><dd>{execution.headSha ?? "Not synced"}</dd></div>
            <div><dt>PR</dt><dd>{execution.prNumber ? `#${execution.prNumber}` : "Not opened"}</dd></div>
          </dl>
        </article>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div><span className="eyebrow">FILE CHANGES</span><h2>Applied work</h2></div>
          <span className="muted">{mergeGate.appliedChanges} applied · {mergeGate.failedChanges} failed</span>
        </div>
        {changes.length ? (
          <div className="changeGrid">
            {changes.map((change) => (
              <article className="changeCard" key={change.id}>
                <div className="outputHeader">
                  <div><span className="rowType">{change.operation}</span><h3>{change.path}</h3></div>
                  <span className={`statusTag status-${change.status}`}>{change.status}</span>
                </div>
                <p>{change.summary}</p>
                {change.commitSha ? <code>{change.commitSha}</code> : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyState compactEmpty">
            <h3>No file changes recorded yet.</h3>
            <p>ChatGPT will apply changes through the connected GitHub tool and sync them here.</p>
          </div>
        )}
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div><span className="eyebrow">REVIEW GATES</span><h2>Required checks</h2></div>
          <span className="muted">{execution.plan.requiredChecks.join(" · ")}</span>
        </div>
        <div className="checkGrid">
          {execution.plan.requiredChecks.map((required) => {
            const check = checks.find((item) => item.name.toLowerCase() === required.toLowerCase());
            return (
              <article className="checkCard" key={required}>
                <strong>{required}</strong>
                <span className={`statusTag status-${check?.status ?? "pending"}`}>
                  {check?.status ?? "pending"}
                </span>
                <p>{check?.details || "Waiting for GitHub/CI result."}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={mergeGate.ready ? "mergeGate ready" : "mergeGate"}>
        <div>
          <span className="eyebrow">MERGE GATE</span>
          <h2>{mergeGate.ready ? "Ready to merge" : "Merge is blocked"}</h2>
          <p>
            {mergeGate.ready
              ? "All required execution records and checks are green."
              : `Missing checks: ${mergeGate.missingChecks.join(", ") || "none"} · Failed checks: ${mergeGate.failedChecks.join(", ") || "none"}`}
          </p>
        </div>
        {execution.prUrl ? (
          <a className="ghostButton" href={execution.prUrl} target="_blank" rel="noreferrer">Open Pull Request</a>
        ) : null}
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div><span className="eyebrow">QA & BROWSER</span><h2>Validate before delivery.</h2></div>
          <span className="muted">CI + Playwright + live Browser Operator</span>
        </div>

        {qaRuns.length ? (
          <div className="runList">
            {qaRuns.slice(0, 5).map((qaRun) => (
              <Link className="runRow" href={`/qa/${qaRun.id}`} key={qaRun.id}>
                <div>
                  <strong>{qaRun.source}</strong>
                  <span>{qaRun.targetUrl || "local CI browser target"}</span>
                </div>
                <span className={`statusTag status-${qaRun.status}`}>{qaRun.status}</span>
              </Link>
            ))}
          </div>
        ) : null}

        {canStartQA ? (
          <StartQAPanel executionId={execution.id} />
        ) : (
          <div className="emptyState compactEmpty">
            <h3>QA waits for GitHub execution readiness.</h3>
            <p>Finish the PR/review flow, then launch automated and live browser validation.</p>
          </div>
        )}
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div><span className="eyebrow">TOOL HANDOFF</span><h2>ChatGPT execution contract</h2></div>
        </div>
        <article className="toolContract">
          <p><strong>Repository:</strong> {github.repository}</p>
          <p><strong>Branch:</strong> {github.workingBranch}</p>
          <ol>
            {github.sequence.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </article>
      </section>
    </main>
  );
}
