import Link from "next/link";
import RecoveryForm from "./recovery-form";

export default function RecoveryPage() {
  return (
    <main className="workspacePage">
      <header className="workspaceHeader">
        <div>
          <span className="eyebrow">RECOVERY CONTROLS</span>
          <h1 className="pageTitle">Controlled retry paths</h1>
          <p className="pageLead">
            Recover failed control-plane state without destructive database or infrastructure operations.
          </p>
        </div>
        <Link className="ghostButton" href="/">Studio Home</Link>
      </header>

      <section className="detailGrid">
        <article className="detailCard">
          <span className="eyebrow">SAFETY</span>
          <p className="briefText">
            Recovery never restarts databases, deletes infrastructure, or silently marks external work successful.
          </p>
        </article>
        <article className="detailCard">
          <span className="eyebrow">AUDIT</span>
          <p className="briefText">
            Every recovery mutation is written to the durable audit log.
          </p>
        </article>
      </section>

      <section className="sectionBlock">
        <RecoveryForm />
      </section>
    </main>
  );
}
