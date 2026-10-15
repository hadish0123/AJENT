"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StartRunButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/projects/${projectId}/runs`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to start agent council.");
      }

      router.push(`/runs/${data.run.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start agent council.");
      setLoading(false);
    }
  }

  return (
    <div className="runLauncher">
      <button className="primaryButton" type="button" onClick={start} disabled={loading}>
        {loading ? "Starting Council..." : "Start Agent Council"}
      </button>
      {error ? <span className="runError">{error}</span> : null}
    </div>
  );
}
