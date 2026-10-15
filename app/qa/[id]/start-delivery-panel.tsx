"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function StartDeliveryPanel({
  qaRunId,
  defaultRepository = "hadish0123/AJENT",
}: {
  qaRunId: string;
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
    const repository = String(form.get("repository") ?? "").trim();
    const branch = String(form.get("branch") ?? "main").trim();

    try {
      const response = await fetch(`/api/qa/${qaRunId}/delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repository, branch }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to prepare Railway delivery.");
      }

      router.push(`/deliveries/${data.delivery.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to prepare Railway delivery.");
      setLoading(false);
    }
  }

  return (
    <form className="deliveryLauncher" onSubmit={start}>
      <div className="executionInputs">
        <input
          name="repository"
          defaultValue={defaultRepository}
          aria-label="Railway GitHub repository"
        />
        <input name="branch" defaultValue="main" aria-label="Railway branch" />
      </div>
      <button className="primaryButton" type="submit" disabled={loading}>
        {loading ? "Preparing Delivery..." : "Prepare Railway Delivery"}
      </button>
      {error ? <span className="runError">{error}</span> : null}
    </form>
  );
}
