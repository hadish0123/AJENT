import { AGENTS } from "@/lib/agents";
import { PROJECT_LABELS } from "@/lib/project-types";

const projectTypes = Object.entries(PROJECT_LABELS);
const coreAgents = AGENTS.filter((agent) =>
  ["requirements", "architect", "uiux", "frontend", "backend", "qa", "lead"].includes(agent.key),
);

export default function HomePage() {
  return (
    <main className="shell">
      <div className="ambient ambientOne" />
      <div className="ambient ambientTwo" />

      <header className="topbar">
        <a className="brand" href="#">
          <span className="brandMark">H</span>
          <span>
            <strong>HADI</strong>
            <small>DEV STUDIO</small>
          </span>
        </a>
        <div className="topActions">
          <span className="statusPill"><i /> GITHUB EXECUTION ONLINE</span>
          <a className="ghostButton" href="/projects">Private Workspace</a>
        </div>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <span className="eyebrow">AI SOFTWARE FACTORY / PHASE 04</span>
          <h1>Build serious software with a private agent team.</h1>
          <p>
            ChatGPT is the brain. GitHub is the source of truth. Railway is the deployment layer.
            HADI Dev Studio coordinates specialist roles from requirements to production.
          </p>
          <div className="heroActions">
            <a className="primaryButton" href="/projects/new">+ New Project</a>
            <a className="textLink" href="#agents">View Agent Team →</a>
          </div>
        </div>

        <aside className="progressCard">
          <div className="progressHeader">
            <span>AJENT / HADI Dev Studio</span>
            <strong>50%</strong>
          </div>
          <div className="progressTrack"><div className="progressValue progress50" /></div>
          <ul className="checkList">
            <li className="done">Project intake + persistence</li>
            <li className="done">Agent council orchestration</li>
            <li className="done">Lead Builder final report</li>
            <li className="done">GitHub branch + change tracking</li>
            <li className="done">PR lifecycle + merge gates</li>
            <li>QA + browser testing</li>
          </ul>
        </aside>
      </section>

      <section className="section">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">PROJECT ROUTER</span>
            <h2>One studio. Multiple delivery teams.</h2>
          </div>
          <span className="muted">Specialists activate automatically by project type.</span>
        </div>
        <div className="projectGrid">
          {projectTypes.map(([key, label]) => (
            <article className="projectCard" key={key}>
              <div className="projectIcon">{label.slice(0, 2).toUpperCase()}</div>
              <div>
                <h3>{label}</h3>
                <p>Architecture, implementation, review and delivery pipeline.</p>
              </div>
              <span className="arrow">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="agents">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">INTERNAL TEAM</span>
            <h2>Core agents behind the build.</h2>
          </div>
          <span className="muted">{AGENTS.length} registered specialist roles</span>
        </div>
        <div className="agentGrid">
          {coreAgents.map((agent, index) => (
            <article className="agentCard" key={agent.key}>
              <div className="agentTop">
                <span className="agentNumber">{String(index + 1).padStart(2, "0")}</span>
                <span className="agentState">READY</span>
              </div>
              <h3>{agent.name}</h3>
              <p>{agent.mission}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="flowSection">
        <div className="sectionHeading compact">
          <div>
            <span className="eyebrow">DELIVERY PIPELINE</span>
            <h2>From client request to production.</h2>
          </div>
        </div>
        <div className="flow">
          {["Intake", "Council", "GitHub", "Build", "Review", "Test", "Deploy"].map((item, index) => (
            <div className="flowItem" key={item}>
              <span>{index + 1}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </section>

      <footer>
        <span>HADI Dev Studio</span>
        <span>Private • Agentic • Production-focused</span>
      </footer>
    </main>
  );
}
