"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function StartQAPanel({ executionId, requiredChecks }: { executionId: string; requiredChecks: string[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const targetUrl = String(form.get("targetUrl") ?? "").trim();

    try {
      const response = await fetch(`/api/executions/${executionId}/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: targetUrl ? "browser_operator" : "ci",
          targetUrl,
          requiredChecks,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create QA run.");
      }

      router.push(`/qa/${data.run.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create QA run.");
      setLoading(false);
    }
  }

  return (
    <form className="qaLauncher" onSubmit={start}>
      <input
        name="targetUrl"
        type="url"
        placeholder="https://deployment.example.com (optional until deployed)"
        aria-label="QA target URL"
      />
      <button className="primaryButton" type="submit" disabled={loading}>
        {loading ? "Starting QA..." : "Start QA Run"}
      </button>
      {error ? <span className="runError">{error}</span> : null}
    </form>
  );
}
