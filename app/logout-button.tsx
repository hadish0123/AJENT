"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <button
      className="ghostButton topbarButton"
      type="button"
      onClick={logout}
      disabled={loading}
    >
      {loading ? "Leaving..." : "Logout"}
    </button>
  );
}
