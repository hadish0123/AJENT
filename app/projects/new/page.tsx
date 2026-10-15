import Link from "next/link";
import ProjectForm from "./project-form";

export default function NewProjectPage() {
  return (
    <main className="workspacePage">
      <header className="workspaceHeader">
        <div>
          <span className="eyebrow">PROJECT INTAKE</span>
          <h1 className="pageTitle">Create a new build.</h1>
          <p className="pageLead">
            Capture the client brief once. HADI Dev Studio creates the internal delivery team and task graph.
          </p>
        </div>
        <Link className="ghostButton" href="/projects">Projects</Link>
      </header>

      <ProjectForm />
    </main>
  );
}
