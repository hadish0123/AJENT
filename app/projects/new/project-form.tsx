"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PROJECT_LABELS, PROJECT_TYPES, type ProjectType } from "@/lib/project-types";

export default function ProjectForm() {
  const router = useRouter();
  const [type, setType] = useState<ProjectType>("website");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      clientName: String(form.get("clientName") ?? ""),
      type,
      brief: String(form.get("brief") ?? ""),
      budget: String(form.get("budget") ?? ""),
      deadline: String(form.get("deadline") ?? ""),
      mustHave: String(form.get("mustHave") ?? "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      constraints: String(form.get("constraints") ?? "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Project creation failed.");
      }

      router.push(`/projects/${data.project.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Project creation failed.");
      setSubmitting(false);
    }
  }

  return (
    <form className="intakeForm" onSubmit={onSubmit}>
      <div className="fieldGrid">
        <label>
          <span>Project name</span>
          <input name="name" required minLength={2} maxLength={120} placeholder="Client VPN Sales Bot" />
        </label>
        <label>
          <span>Client</span>
          <input name="clientName" maxLength={120} placeholder="Optional" />
        </label>
      </div>

      <fieldset>
        <legend>Project type</legend>
        <div className="typePicker">
          {PROJECT_TYPES.map((item) => (
            <button
              type="button"
              key={item}
              className={type === item ? "typeChoice active" : "typeChoice"}
              onClick={() => setType(item)}
            >
              {PROJECT_LABELS[item]}
            </button>
          ))}
        </div>
      </fieldset>

      <label>
        <span>Client brief</span>
        <textarea
          name="brief"
          required
          minLength={20}
          rows={9}
          placeholder="Paste the client's full request, features, examples and expectations..."
        />
      </label>

      <div className="fieldGrid">
        <label>
          <span>Budget</span>
          <input name="budget" placeholder="e.g. 25,000,000 Toman" />
        </label>
        <label>
          <span>Deadline</span>
          <input name="deadline" placeholder="e.g. 14 days" />
        </label>
      </div>

      <div className="fieldGrid">
        <label>
          <span>Must-have features</span>
          <textarea name="mustHave" rows={5} placeholder={"One item per line\nAdmin panel\nPayment\nAPI integration"} />
        </label>
        <label>
          <span>Constraints</span>
          <textarea name="constraints" rows={5} placeholder={"One item per line\nExisting API only\nMobile-first"} />
        </label>
      </div>

      {error ? <div className="formError">{error}</div> : null}

      <div className="formActions">
        <button className="primaryButton" type="submit" disabled={submitting}>
          {submitting ? "Creating Project..." : "Create Project & Task Graph"}
        </button>
        <button className="ghostButton" type="button" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  );
}
