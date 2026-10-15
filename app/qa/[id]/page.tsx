import Link from "next/link";
import { notFound } from "next/navigation";
import { getQARunBundle } from "@/lib/qa-db";
import { getRailwayDeliveryByQaRun } from "@/lib/railway-delivery-db";
import type { RailwayDeliveryRecord } from "@/lib/railway-delivery";
import StartDeliveryPanel from "./start-delivery-panel";

export const dynamic = "force-dynamic";

export default async function QARunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let bundle;
  try {
    bundle = await getQARunBundle(id);
  } catch {
    bundle = null;
  }

  if (!bundle) notFound();

  const { run, execution, checks, bugs, gate, browser } = bundle;

  let delivery: RailwayDeliveryRecord | null = null;
  try {
    delivery = await getRailwayDeliveryByQaRun(run.id);
  } catch {
    delivery = null;
  }

  return (
    <main className="workspacePage">
      <header className="workspaceHeader">
        <div>
          <span className="eyebrow">QA RUN / {run.status.toUpperCase()}</span>
          <h1 className="pageTitle">Validation & bug loop</h1>
          <p className="pageLead">
            {execution.repository} · source: {run.source}
          </p>
        </div>
        <Link className="ghostButton" href={`/executions/${execution.id}`}>Execution</Link>
      </header>

      <section className="projectSummaryGrid">
        <article className="summaryCard"><span>Required checks</span><strong>{run.requiredChecks.length}</strong></article>
        <article className="summaryCard"><span>Recorded checks</span><strong>{checks.length}</strong></article>
        <article className="summaryCard"><span>Open bugs</span><strong>{gate.unresolvedBugs}</strong></article>
        <article className="summaryCard"><span>QA gate</span><strong>{gate.ready ? "READY" : "BLOCKED"}</strong></article>
      </section>

      <section className="detailGrid">
        <article className="detailCard">
          <span className="eyebrow">BROWSER TARGET</span>
          <p className="briefText">{run.targetUrl || "No public deployment URL yet. CI browser smoke tests still run locally."}</p>
        </article>
        <article className="detailCard">
          <span className="eyebrow">OPERATOR MODE</span>
          <p className="briefText">{browser.mode}</p>
          <p className="muted">Public HTTPS required for live Browser Operator validation.</p>
        </article>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div><span className="eyebrow">CHECK MATRIX</span><h2>Automated & browser validation</h2></div>
          <span className="muted">{run.requiredChecks.join(" · ")}</span>
        </div>

        <div className="checkGrid">
          {run.requiredChecks.map((required) => {
            const check = checks.find((item) => item.name.toLowerCase() === required.toLowerCase());
            return (
              <article className="checkCard" key={required}>
                <strong>{required}</strong>
                <span className={`statusTag status-${check?.status ?? "pending"}`}>
                  {check?.status ?? "pending"}
                </span>
                <p>{check?.details || "Waiting for validation result."}</p>
                {check?.evidenceUrl ? (
                  <a className="textLink" href={check.evidenceUrl} target="_blank" rel="noreferrer">
                    Evidence →
                  </a>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div><span className="eyebrow">BUG LOOP</span><h2>Issues routed back to builders</h2></div>
          <span className="muted">{gate.criticalBugs} critical · {gate.unresolvedBugs} unresolved</span>
        </div>

        {bugs.length ? (
          <div className="bugGrid">
            {bugs.map((bug) => (
              <article className="bugCard" key={bug.id}>
                <div className="outputHeader">
                  <div>
                    <span className="rowType">{bug.severity}</span>
                    <h3>{bug.title}</h3>
                  </div>
                  <span className={`statusTag status-${bug.status}`}>{bug.status}</span>
                </div>
                <p>{bug.description}</p>
                <small>Assigned: {bug.assignedAgent}</small>
                {bug.path ? <small>Path: {bug.path}</small> : null}
                {bug.fixedCommitSha ? <code>{bug.fixedCommitSha}</code> : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyState compactEmpty">
            <h3>No bugs recorded.</h3>
            <p>Failed checks or live browser findings can be persisted here and sent back into the implementation loop.</p>
          </div>
        )}
      </section>

      <section className={gate.ready ? "mergeGate ready" : "mergeGate"}>
        <div>
          <span className="eyebrow">QA GATE</span>
          <h2>{gate.ready ? "Validation complete" : "Validation is blocked"}</h2>
          <p>
            Missing: {gate.missingChecks.join(", ") || "none"} · Failed: {gate.failedChecks.join(", ") || "none"} ·
            Blocked: {gate.blockedChecks.join(", ") || "none"} · Bugs: {gate.unresolvedBugs}
          </p>
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div><span className="eyebrow">RAILWAY DELIVERY</span><h2>Move validated code to production.</h2></div>
          <span className="muted">ChatGPT → Railway → Health → Live browser</span>
        </div>

        {delivery ? (
          <Link className="executionLinkCard" href={`/deliveries/${delivery.id}`}>
            <div>
              <span className="rowType">{delivery.repository}</span>
              <h3>{delivery.domain ?? "Railway delivery prepared"}</h3>
              <p>{delivery.status} · health {delivery.healthState}</p>
            </div>
            <span className={`statusTag status-${delivery.status}`}>{delivery.status}</span>
          </Link>
        ) : gate.ready ? (
          <StartDeliveryPanel qaRunId={run.id} defaultRepository={execution.repository} />
        ) : (
          <div className="emptyState compactEmpty">
            <h3>Railway delivery waits for the QA gate.</h3>
            <p>All required checks must pass and all bugs must be resolved before production delivery is prepared.</p>
          </div>
        )}
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div><span className="eyebrow">BROWSER PROTOCOL</span><h2>Live UI validation contract</h2></div>
        </div>
        <article className="toolContract">
          <ol>{browser.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </article>
      </section>
    </main>
  );
}
