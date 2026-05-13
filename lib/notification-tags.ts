export const TAG_NO_OP = "no-op";
export const TAG_CANARY = "canary";
export const TAG_TEST = "test-endpoint";
export const TAG_HANDLER_ERROR = "handler-error";

const PREFIX_TAGS = [TAG_CANARY, TAG_HANDLER_ERROR] as const;
const EXACT_TAGS = [TAG_NO_OP, TAG_TEST] as const;

export type NotificationTag =
  | typeof TAG_NO_OP
  | typeof TAG_CANARY
  | typeof TAG_TEST
  | typeof TAG_HANDLER_ERROR
  | null;

export function tagOf(errorMessage: string | null): NotificationTag {
  if (!errorMessage) return null;
  for (const t of EXACT_TAGS) {
    if (errorMessage === t) return t;
  }
  for (const t of PREFIX_TAGS) {
    if (errorMessage === t || errorMessage.startsWith(`${t}: `)) return t;
  }
  return null;
}

export function withSuffix(tag: typeof TAG_CANARY | typeof TAG_HANDLER_ERROR, detail: string): string {
  return `${tag}: ${detail}`;
}

export const TAG_LABEL: Record<Exclude<NotificationTag, null>, string> = {
  [TAG_NO_OP]: "no-op",
  [TAG_CANARY]: "canary",
  [TAG_TEST]: "test",
  [TAG_HANDLER_ERROR]: "error",
};
