import Link from "next/link";
import { SPECIALIST_WORKFLOWS } from "@/lib/specialist-workflows";

const workflows = Object.values(SPECIALIST_WORKFLOWS);

export default function SpecialistsPage() {
  return (
    <main className="workspacePage">
      <header className="workspaceHeader">
        <div>
          <span className="eyebrow">SPECIALIST CONTROL CENTER</span>
          <h1 className="pageTitle">Production workflows</h1>
          <p className="pageLead">
            Project-specific policies activate automatically for Telegram, VPN/subscription,
            mobile, game and AI builds.
          </p>
        </div>
        <Link className="ghostButton" href="/">Studio Home</Link>
      </header>

      <section className="specialistGrid">
        {workflows.map((workflow) => (
          <article className="specialistCard" key={workflow.key}>
            <div className="specialistCardHeader">
              <div>
                <span className="rowType">{workflow.key}</span>
                <h2>{workflow.label}</h2>
              </div>
              <span className="statusTag status-ready">{workflow.leadAgent}</span>
            </div>
            <p>{workflow.description}</p>

            <div className="specialistColumns">
              <div>
                <strong>Execution</strong>
                <ul>
                  {workflow.implementationSequence.slice(0, 4).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Release gates</strong>
                <ul>
                  {workflow.releaseGates.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>

            <div className="specialistMeta">
              <span>GitHub: {workflow.executionChecks.join(", ") || "generic"}</span>
              <span>QA: {workflow.qaChecks.join(", ") || "generic"}</span>
              <span>
                Vars: {[...workflow.requiredVariableNames, ...workflow.optionalVariableNames].join(", ") || "none"}
              </span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
