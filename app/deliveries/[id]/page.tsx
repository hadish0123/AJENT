import Link from "next/link";
import { notFound } from "next/navigation";
import { getRailwayDeliveryBundle } from "@/lib/railway-delivery-db";

export const dynamic = "force-dynamic";

export default async function RailwayDeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let bundle;
  try {
    bundle = await getRailwayDeliveryBundle(id);
  } catch {
    bundle = null;
  }

  if (!bundle) notFound();

  const { delivery, qaRun, execution, variables, logs, gate, plan, railway } = bundle;

  return (
    <main className="workspacePage">
      <header className="workspaceHeader">
        <div>
          <span className="eyebrow">RAILWAY DELIVERY / {delivery.status.toUpperCase()}</span>
          <h1 className="pageTitle">Production delivery</h1>
          <p className="pageLead">
            {delivery.repository} · {delivery.branch} · QA {qaRun.status}
          </p>
        </div>
        <Link className="ghostButton" href={`/qa/${qaRun.id}`}>QA Run</Link>
      </header>

      <section className="projectSummaryGrid">
        <article className="summaryCard"><span>Railway project</span><strong>{delivery.railwayProjectId ? "LINKED" : "PENDING"}</strong></article>
        <article className="summaryCard"><span>Service</span><strong>{delivery.serviceId ? "LINKED" : "PENDING"}</strong></article>
        <article className="summaryCard"><span>Health</span><strong>{delivery.healthState.toUpperCase()}</strong></article>
        <article className="summaryCard"><span>Delivery gate</span><strong>{gate.ready ? "READY" : "BLOCKED"}</strong></article>
      </section>

      <section className="detailGrid">
        <article className="detailCard">
          <span className="eyebrow">DELIVERY PLAN</span>
          <dl className="executionFacts">
            <div><dt>Builder</dt><dd>{plan.configuration.builder}</dd></div>
            <div><dt>Build</dt><dd>{plan.configuration.buildCommand}</dd></div>
            <div><dt>Start</dt><dd>{plan.configuration.startCommand}</dd></div>
            <div><dt>Health</dt><dd>{plan.configuration.healthcheckPath}</dd></div>
            <div><dt>Restart</dt><dd>{plan.configuration.restartPolicyType}</dd></div>\n            <div><dt>Variables</dt><dd>{plan.requiredVariables.join(", ")}</dd></div>
          </dl>
        </article>
        <article className="detailCard">
          <span className="eyebrow">RAILWAY IDS</span>
          <dl className="executionFacts">
            <div><dt>Project</dt><dd>{delivery.railwayProjectId ?? "Not provisioned"}</dd></div>
            <div><dt>Environment</dt><dd>{delivery.environmentId ?? "Not provisioned"}</dd></div>
            <div><dt>Service</dt><dd>{delivery.serviceId ?? "Not provisioned"}</dd></div>
            <div><dt>Deployment</dt><dd>{delivery.deploymentId ?? "Not deployed"}</dd></div>
            <div><dt>Domain</dt><dd>{delivery.domain ?? "Not generated"}</dd></div>
          </dl>
        </article>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">ENVIRONMENT VARIABLES</span>
            <h2>Names only. Secrets stay outside AJENT.</h2>
          </div>
          <span className="muted">{variables.length} records</span>
        </div>

        {variables.length ? (
          <div className="checkGrid">
            {variables.map((variable) => (
              <article className="checkCard" key={variable.id}>
                <strong>{variable.name}</strong>
                <span className={`statusTag status-${variable.status}`}>{variable.status}</span>
                <p>{variable.scope} scope</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyState compactEmpty">
            <h3>No variable names synced yet.</h3>
            <p>DATABASE_URL is required before the delivery gate can pass.</p>
          </div>
        )}
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">HEALTH & DELIVERY GATE</span>
            <h2>{gate.ready ? "Production is healthy" : "Production is not ready"}</h2>
          </div>
        </div>

        <section className={gate.ready ? "mergeGate ready" : "mergeGate"}>
          <div>
            <p>
              Missing infrastructure: {gate.missingInfrastructure.join(", ") || "none"} ·
              Missing variables: {gate.missingVariables.join(", ") || "none"} ·
              Health: {delivery.healthState}
            </p>
            {delivery.healthText ? <p>{delivery.healthText}</p> : null}
            {delivery.lastError ? <p className="deliveryError">{delivery.lastError}</p> : null}
          </div>
          {delivery.domain ? (
            <a
              className="ghostButton"
              href={delivery.domain.startsWith("http") ? delivery.domain : `https://${delivery.domain}`}
              target="_blank"
              rel="noreferrer"
            >
              Open Production
            </a>
          ) : null}
        </section>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div><span className="eyebrow">RECENT LOGS</span><h2>Build & runtime evidence</h2></div>
          <span className="muted">{logs.length} stored</span>
        </div>

        {logs.length ? (
          <div className="deliveryLogList">
            {logs.slice(0, 30).map((log) => (
              <article className="deliveryLogRow" key={log.id}>
                <span className="rowType">{log.stream}</span>
                <span className="deliverySeverity">{log.severity}</span>
                <p>{log.message}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyState compactEmpty">
            <h3>No Railway logs synced yet.</h3>
            <p>ChatGPT records relevant build/deploy failure evidence after reading Railway logs.</p>
          </div>
        )}
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div><span className="eyebrow">TOOL HANDOFF</span><h2>Railway execution contract</h2></div>
        </div>
        <article className="toolContract">
          <p><strong>Repository:</strong> {railway.repository}</p>
          <p><strong>Branch:</strong> {railway.branch}</p>
          <ol>
            {railway.sequence.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </article>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div><span className="eyebrow">SOURCE</span><h2>Delivery came from validated code.</h2></div>
        </div>
        <Link className="executionLinkCard" href={`/executions/${execution.id}`}>
          <div>
            <span className="rowType">{execution.repository}</span>
            <h3>{execution.workingBranch}</h3>
            <p>GitHub execution · {execution.status}</p>
          </div>
          <span className="statusTag status-passed">validated</span>
        </Link>
      </section>
    </main>
  );
}
