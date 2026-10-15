import postgres from "postgres";

let client: ReturnType<typeof postgres> | null = null;

export function getDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!client) {
    client = postgres(url, {
      max: 8,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }

  return client;
}
