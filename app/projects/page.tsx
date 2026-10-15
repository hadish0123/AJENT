import Link from "next/link";
import { listProjects } from "@/lib/db";
import { PROJECT_LABELS } from "@/lib/project-types";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  let projects = [];
  let databaseError = "";

  try {
    projects = await listProjects();
  } catch (error) {
    databaseError = error instanceof Error ? error.message : "Database unavailable.";
  }

  return (
    <main className="workspacePage">
      <header className="workspaceHeader">
        <div>
          <span className="eyebrow">PROJECT CONTROL</span>
          <h1 className="pageTitle">Projects</h1>
          <p className="pageLead">Persistent client projects, agent task graphs and delivery state.</p>
        </div>
        <Link className="primaryButton" href="/projects/new">+ New Project</Link>
      </header>

      {databaseError ? (
        <section className="noticeCard">
          <strong>Database not connected</strong>
          <p>{databaseError}</p>
          <code>Set DATABASE_URL to enable durable project persistence.</code>
        </section>
      ) : projects.length === 0 ? (
        <section className="emptyState">
          <span className="eyebrow">EMPTY WORKSPACE</span>
          <h2>Create the first client project.</h2>
          <p>The agent team and delivery graph will be generated automatically.</p>
          <Link className="primaryButton" href="/projects/new">Create Project</Link>
        </section>
      ) : (
        <section className="projectList">
          {projects.map((project) => (
            <Link className="projectRow" href={`/projects/${project.id}`} key={project.id}>
              <div>
                <span className="rowType">{PROJECT_LABELS[project.type]}</span>
                <h2>{project.name}</h2>
                <p>{project.clientName || "Direct project"}</p>
              </div>
              <div className="rowMeta">
                <span className={`statusTag status-${project.status}`}>{project.status}</span>
                <span>{project.taskGraph.length} tasks</span>
              </div>
            </Link>
          ))}
        </section>
      )}

      <div className="backLink"><Link href="/">← Studio overview</Link></div>
    </main>
  );
}
