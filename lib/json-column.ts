export function parseJsonColumn<T>(value: T | string): T {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error("Invalid JSON column returned by the database.");
  }
}

export function parseNullableJsonColumn<T>(
  value: T | string | null,
): T | null {
  if (value === null) return null;
  return parseJsonColumn<T>(value);
}
