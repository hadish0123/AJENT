import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/db";
import { PROJECT_LABELS } from "@/lib/project-types";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let project;
  try {
    project = await getProject(id);
  } catch {
    project = null;
  }

  if (!project) notFound();

  const completed = project.taskGraph.filter((task) => task.status === "done").length;
  const percent = Math.round((completed / Math.max(project.taskGraph.length, 1)) * 100);

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
        <article className="summaryCard">
          <span>Budget</span>
          <strong>{project.budget || "Not set"}</strong>
        </article>
        <article className="summaryCard">
          <span>Tasks</span>
          <strong>{project.taskGraph.length}</strong>
        </article>
        <article className="summaryCard">
          <span>Progress</span>
          <strong>{percent}%</strong>
        </article>
        <article className="summaryCard">
          <span>Updated</span>
          <strong>{new Date(project.updatedAt).toLocaleDateString("en-US")}</strong>
        </article>
      </section>

      <section className="detailGrid">
        <article className="detailCard">
          <span className="eyebrow">CLIENT BRIEF</span>
          <p className="briefText">{project.brief}</p>
        </article>
        <article className="detailCard">
          <span className="eyebrow">ACCEPTANCE BASELINE</span>
          <ul className="cleanList">
            {project.requirements.acceptanceCriteria.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">TASK GRAPH</span>
            <h2>Internal delivery pipeline</h2>
          </div>
          <span className="muted">{project.taskGraph.length} agent tasks</span>
        </div>

        <div className="taskList">
          {project.taskGraph.map((task, index) => (
            <article className="taskRow" key={task.id}>
              <span className="taskIndex">{String(index + 1).padStart(2, "0")}</span>
              <div className="taskMain">
                <strong>{task.title}</strong>
                <span>{task.agent}</span>
              </div>
              <div className="taskDependencies">
                {task.dependsOn.length ? `after ${task.dependsOn.map((item) => item.replace("task-", "")).join(", ")}` : "entry point"}
              </div>
              <span className={`statusTag status-${task.status}`}>{task.status}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
