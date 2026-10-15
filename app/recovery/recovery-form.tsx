"use client";

import { FormEvent, useState } from "react";
import { RECOVERY_ACTIONS, RECOVERY_DESCRIPTIONS, type RecoveryAction } from "@/lib/recovery";

export default function RecoveryForm() {
  const [action, setAction] = useState<RecoveryAction>("project.resume");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    const resourceId = String(form.get("resourceId") ?? "").trim();

    try {
      const response = await fetch("/api/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, resourceId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Recovery failed.");
      setMessage(data.result.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Recovery failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="recoveryForm" onSubmit={submit}>
      <label>
        <span>Recovery action</span>
        <select value={action} onChange={(event) => setAction(event.target.value as RecoveryAction)}>
          {RECOVERY_ACTIONS.map((item) => (
            <option value={item} key={item}>{item}</option>
          ))}
        </select>
      </label>
      <p className="muted">{RECOVERY_DESCRIPTIONS[action]}</p>
      <label>
        <span>Resource UUID</span>
        <input name="resourceId" required placeholder="00000000-0000-0000-0000-000000000000" />
      </label>
      <button className="primaryButton" type="submit" disabled={loading}>
        {loading ? "Applying Recovery..." : "Apply Recovery"}
      </button>
      {message ? <div className="successNotice">{message}</div> : null}
      {error ? <div className="formError">{error}</div> : null}
    </form>
  );
}
