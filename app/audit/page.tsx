import Link from "next/link";
import { listAuditEvents } from "@/lib/audit-db";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  let events = [];
  try {
    events = await listAuditEvents(150);
  } catch {
    events = [];
  }

  return (
    <main className="workspacePage">
      <header className="workspaceHeader">
        <div>
          <span className="eyebrow">PRODUCTION HARDENING</span>
          <h1 className="pageTitle">Audit log</h1>
          <p className="pageLead">Durable mutation and authentication evidence.</p>
        </div>
        <Link className="ghostButton" href="/">Studio Home</Link>
      </header>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div><span className="eyebrow">LATEST EVENTS</span><h2>Control-plane activity</h2></div>
          <span className="muted">{events.length} loaded</span>
        </div>

        {events.length ? (
          <div className="auditList">
            {events.map((event) => (
              <article className="auditRow" key={event.id}>
                <div>
                  <strong>{event.action}</strong>
                  <span>{event.resourceType}{event.resourceId ? ` / ${event.resourceId}` : ""}</span>
                </div>
                <div>
                  <span>{event.actor} · {event.role}</span>
                  <small>{new Date(event.createdAt).toLocaleString()}</small>
                </div>
                <span className={`statusTag status-${event.outcome === "success" ? "passed" : "failed"}`}>
                  {event.outcome}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyState compactEmpty">
            <h3>No audit events available.</h3>
            <p>Events appear after authenticated mutations or login activity.</p>
          </div>
        )}
      </section>
    </main>
  );
}
