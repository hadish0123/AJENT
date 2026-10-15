import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgentRunBundle } from "@/lib/agent-runs-db";
import { getExecutionByRun } from "@/lib/execution-db";
import { RUN_STAGES } from "@/lib/orchestration";
import StartExecutionPanel from "./start-execution-panel";

export const dynamic = "force-dynamic";

export default async function AgentRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let bundle;
  try {
    bundle = await getAgentRunBundle(id);
  } catch {
    bundle = null;
  }

  if (!bundle) notFound();

  const { run, project, outputs, next } = bundle;
  const execution = run.status === "completed" ? await getExecutionByRun(run.id) : null;
  const stageIndex = RUN_STAGES.indexOf(run.currentStage);
  const progress =
    run.status === "completed"
      ? 100
      : Math.round((stageIndex / RUN_STAGES.length) * 100);

  return (
    <main className="workspacePage">
      <header className="workspaceHeader">
        <div>
          <span className="eyebrow">AGENT COUNCIL / {run.status.toUpperCase()}</span>
          <h1 className="pageTitle">{project.name}</h1>
          <p className="pageLead">
            Stage: {run.currentStage} · {run.participants.length} internal agents · {outputs.length} structured outputs
          </p>
        </div>
        <Link className="ghostButton" href={`/projects/${project.id}`}>Project</Link>
      </header>

      <section className="runProgressCard">
        <div className="progressHeader">
          <span>Council execution</span>
          <strong>{progress}%</strong>
        </div>
        <div className="progressTrack">
          <div className="runProgressValue" style={{ width: `${progress}%` }} />
        </div>
        <div className="stageStrip">
          {RUN_STAGES.map((stage) => {
            const index = RUN_STAGES.indexOf(stage);
            const state =
              run.status === "completed" || index < stageIndex
                ? "done"
                : stage === run.currentStage
                  ? "active"
                  : "pending";
            return <span className={`stageChip ${state}`} key={stage}>{stage}</span>;
          })}
        </div>
      </section>

      {run.finalReport ? (
        <>
          <section className="finalReport">
            <span className="eyebrow">LEAD BUILDER FINAL</span>
            <h2>Approved implementation direction</h2>
            <p>{run.finalReport.executiveSummary}</p>
            <div className="reportGrid">
              <div>
                <strong>Decisions</strong>
                <ul>{run.finalReport.decisions.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div>
                <strong>Risks</strong>
                <ul>{run.finalReport.risks.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div>
                <strong>Actions</strong>
                <ul>{run.finalReport.actions.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>
          </section>

          <section className="sectionBlock">
            <div className="sectionHeading">
              <div>
                <span className="eyebrow">GITHUB EXECUTION</span>
                <h2>Move the approved plan into code.</h2>
              </div>
            </div>

            {execution ? (
              <Link className="executionLinkCard" href={`/executions/${execution.id}`}>
                <div>
                  <span className="rowType">{execution.repository}</span>
                  <h3>{execution.workingBranch}</h3>
                  <p>PR #{execution.prNumber ?? "—"} · {execution.status}</p>
                </div>
                <span className={`statusTag status-${execution.status}`}>{execution.status}</span>
              </Link>
            ) : (
              <StartExecutionPanel runId={run.id} />
            )}
          </section>
        </>
      ) : (
        <section className="sectionBlock">
          <div className="sectionHeading">
            <div>
              <span className="eyebrow">NEXT AGENTS</span>
              <h2>{next.length} agent task{next.length === 1 ? "" : "s"} ready</h2>
            </div>
            <span className="muted">ChatGPT executes these roles and submits structured output.</span>
          </div>
          <div className="promptGrid">
            {next.map((task) => (
              <article className="promptCard" key={task.agent}>
                <div className="agentTop">
                  <strong>{task.name}</strong>
                  <span className="agentState">{task.stage.toUpperCase()}</span>
                </div>
                <p>{task.mission}</p>
                <details>
                  <summary>Execution prompt</summary>
                  <pre>{task.prompt}</pre>
                </details>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">COUNCIL OUTPUTS</span>
            <h2>Structured reasoning log</h2>
          </div>
          <span className="muted">{outputs.length} outputs stored</span>
        </div>

        {outputs.length === 0 ? (
          <div className="emptyState">
            <h3>No output submitted yet.</h3>
            <p>The current stage is ready for ChatGPT agent execution.</p>
          </div>
        ) : (
          <div className="outputGrid">
            {outputs.map((output) => (
              <article className="outputCard" key={output.id}>
                <div className="outputHeader">
                  <div>
                    <span className="rowType">{output.stage}</span>
                    <h3>{output.agent}</h3>
                  </div>
                  <span className={`statusTag stance-${output.stance}`}>{output.stance} · {output.confidence}%</span>
                </div>
                <p>{output.summary}</p>
                {output.decisions.length ? <small>Decisions: {output.decisions.join(" · ")}</small> : null}
                {output.risks.length ? <small>Risks: {output.risks.join(" · ")}</small> : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
