import type { ProjectType } from "./project-types";

const VPN_HINT =
  /\b(vpn|vless|vmess|xray|wireguard|openvpn|sing-box|sanaei|pasargad|subscription)\b|فیلترشکن|کانفیگ|اشتراک\s*(vpn|وی\s*پی\s*ان)?/iu;

const AI_HINT =
  /\b(ai|llm|agent|agents|chatgpt|openai|anthropic|gemini|rag|embedding|vector)\b|هوش\s*مصنوعی|ایجنت|مدل\s*زبانی/iu;

export function hasVpnScope(type: ProjectType, brief = "") {
  return type === "vpn-panel" ||
    (["telegram-bot", "admin-panel", "custom"].includes(type) && VPN_HINT.test(brief));
}

export function hasAiScope(type: ProjectType, brief = "") {
  return type === "ai-system" ||
    (["website", "telegram-bot", "admin-panel", "mobile-app", "custom"].includes(type) && AI_HINT.test(brief));
}
