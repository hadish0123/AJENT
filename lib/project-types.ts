export const PROJECT_TYPES = [
  "website",
  "telegram-bot",
  "admin-panel",
  "vpn-panel",
  "mobile-app",
  "game",
  "ai-system",
  "custom",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_LABELS: Record<ProjectType, string> = {
  website: "Website",
  "telegram-bot": "Telegram Bot",
  "admin-panel": "Admin Panel",
  "vpn-panel": "VPN Panel",
  "mobile-app": "Mobile App",
  game: "Game",
  "ai-system": "AI System",
  custom: "Custom",
};
