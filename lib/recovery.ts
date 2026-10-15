import { z } from "zod";

export const RECOVERY_ACTIONS = [
  "project.resume",
  "execution.retry",
  "qa.retry",
  "delivery.retry",
] as const;

export type RecoveryAction = (typeof RECOVERY_ACTIONS)[number];

export const recoveryRequestSchema = z.object({
  action: z.enum(RECOVERY_ACTIONS),
  resourceId: z.string().uuid(),
});

export type RecoveryResult = {
  action: RecoveryAction;
  resourceType: "project" | "execution" | "qa" | "delivery";
  resourceId: string;
  nextResourceId?: string;
  status: string;
  message: string;
};

export const RECOVERY_DESCRIPTIONS: Record<RecoveryAction, string> = {
  "project.resume": "Resume a paused project back into planned work.",
  "execution.retry": "Return a failed GitHub execution to coding and reset failed checks to pending.",
  "qa.retry": "Clone a failed/blocked QA run into a fresh validation run with the same requirements.",
  "delivery.retry": "Reset a failed/blocked Railway delivery to planned without deleting linked infrastructure.",
};
