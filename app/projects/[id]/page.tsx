import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/db";
import { listProjectRuns } from "@/lib/agent-runs-db";
import type { AgentRunRecord } from "@/lib/orchestration";
import { PROJECT_LABELS } from "@/lib/project-types";
import StartRunButton from "./start-run-button";
import { getSpecialistVariableNames, getSpecialistWorkflows } from "@/lib/specialist-workflows";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let project;
  let runs: AgentRunRecord[] = [];
  try {
    project = await getProject(id);
    if (project) {
      runs = await listProjectRuns(id);
    }
  } catch {
    project = null;
  }

  if (!project) notFound();

  const completed = project.taskGraph.filter((task) => task.status === "done").length;
  const percent = Math.round((completed / Math.max(project.taskGraph.length, 1)) * 100);
  const specialistWorkflows = getSpecialistWorkflows(project.type, project.brief);
  const specialistVariables = getSpecialistVariableNames(project.type, project.brief);

  return (
    <main className="workspacePage">
      <header className="workspaceHeader">
        <div>
          <span className="eyebrow">{PROJECT_LABELS[project.type]} / {project.status.toUpperCase()}</span>
          <h1 className="pageTitle">{project.name}</h1>
          <p className="pageLead">{project.clientName || "Direct project"} · {project.deadline || "No deadline set"}</p>
        </div>
        <Link className="ghostButton" href="/projects">All Projects</Link>
      </header>

      <section className="projectSummaryGrid">
        <article className="summaryCard"><span>Budget</span><strong>{project.budget || "Not set"}</strong></article>
        <article className="summaryCard"><span>Tasks</span><strong>{project.taskGraph.length}</strong></article>
        <article className="summaryCard"><span>Progress</span><strong>{percent}%</strong></article>
        <article className="summaryCard"><span>Council Runs</span><strong>{runs.length}</strong></article>
      </section>

      <section className="detailGrid">
        <article className="detailCard">
          <span className="eyebrow">CLIENT BRIEF</span>
          <p className="briefText">{project.brief}</p>
        </article>
        <article className="detailCard">
          <span className="eyebrow">ACCEPTANCE BASELINE</span>
          <ul className="cleanList">{project.requirements.acceptanceCriteria.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">SPECIALIST ROUTING</span>
            <h2>Project-specific production workflow</h2>
          </div>
          <Link className="textLink" href="/specialists">All specialist policies →</Link>
        </div>

        {specialistWorkflows.length ? (
          <div className="specialistProjectGrid">
            {specialistWorkflows.map((workflow) => (
              <article className="specialistProjectCard" key={workflow.key}>
                <div className="outputHeader">
                  <div>
                    <span className="rowType">{workflow.key}</span>
                    <h3>{workflow.label}</h3>
                  </div>
                  <span className="statusTag status-ready">{workflow.leadAgent}</span>
                </div>
                <p>{workflow.description}</p>
                <div className="specialistCheckRow">
                  {workflow.executionChecks.map((check) => (
                    <span className="statusTag" key={check}>GitHub: {check}</span>
                  ))}
                  {workflow.qaChecks.map((check) => (
                    <span className="statusTag" key={check}>QA: {check}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyState compactEmpty">
            <h3>General software workflow active.</h3>
            <p>This project uses the core architecture, frontend/backend, security, QA and DevOps policies.</p>
          </div>
        )}

        {(specialistVariables.required.length || specialistVariables.optional.length) ? (
          <div className="variablePolicyCard">
            <strong>Environment variable policy</strong>
            <p>
              Required names: {specialistVariables.required.join(", ") || "none"} ·
              Optional names: {specialistVariables.optional.join(", ") || "none"}
            </p>
            <small>Only variable names are planned here; secret values must remain outside source control.</small>
          </div>
        ) : null}
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div><span className="eyebrow">AGENT COUNCIL</span><h2>Analyze, debate, review, decide.</h2></div>
          <StartRunButton projectId={project.id} />
        </div>
        {runs.length ? (
          <div className="runList">
            {runs.slice(0, 5).map((run) => (
              <Link className="runRow" href={`/runs/${run.id}`} key={run.id}>
                <div><strong>{run.currentStage}</strong><span>{run.participants.length} agents</span></div>
                <span className={`statusTag status-${run.status}`}>{run.status}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="emptyState compactEmpty"><h3>No council run yet.</h3><p>Start the agent council to produce a reviewed implementation direction.</p></div>
        )}
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div><span className="eyebrow">TASK GRAPH</span><h2>Internal delivery pipeline</h2></div>
          <span className="muted">{project.taskGraph.length} agent tasks</span>
        </div>
        <div className="taskList">
          {project.taskGraph.map((task, index) => (
            <article className="taskRow" key={task.id}>
              <span className="taskIndex">{String(index + 1).padStart(2, "0")}</span>
              <div className="taskMain"><strong>{task.title}</strong><span>{task.agent}</span></div>
              <div className="taskDependencies">{task.dependsOn.length ? `after ${task.dependsOn.map((item) => item.replace("task-", "")).join(", ")}` : "entry point"}</div>
              <span className={`statusTag status-${task.status}`}>{task.status}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
