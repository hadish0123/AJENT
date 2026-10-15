"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function StartExecutionPanel({
  runId,
  defaultRepository = "hadish0123/AJENT",
}: {
  runId: string;
  defaultRepository?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const repository = String(form.get("repository") ?? "");
    const baseBranch = String(form.get("baseBranch") ?? "main");

    try {
      const response = await fetch(`/api/runs/${runId}/execution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repository, baseBranch }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create GitHub execution.");
      }

      router.push(`/executions/${data.execution.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create GitHub execution.");
      setLoading(false);
    }
  }

  return (
    <form className="executionLauncher" onSubmit={start}>
      <div className="executionInputs">
        <input name="repository" defaultValue={defaultRepository} aria-label="GitHub repository" />
        <input name="baseBranch" defaultValue="main" aria-label="Base branch" />
      </div>
      <button className="primaryButton" type="submit" disabled={loading}>
        {loading ? "Preparing GitHub..." : "Create GitHub Execution"}
      </button>
      {error ? <span className="runError">{error}</span> : null}
    </form>
  );
}
