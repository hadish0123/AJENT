"use client";

import { FormEvent, useState } from "react";

export default function LoginForm({ returnTo }: { returnTo: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, returnTo }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Login failed.");
      }

      window.location.assign(data.returnTo || "/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Login failed.");
      setLoading(false);
    }
  }

  return (
    <form className="loginForm" onSubmit={submit}>
      <label>
        <span>Studio password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          autoFocus
        />
      </label>
      <button className="primaryButton" type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Enter HADI Dev Studio"}
      </button>
      {error ? <div className="formError">{error}</div> : null}
    </form>
  );
}
