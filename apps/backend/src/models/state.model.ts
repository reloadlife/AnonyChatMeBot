/**
 * Bot FSM — all possible conversation states.
 *
 * Each state is a discriminated union variant so TypeScript enforces the
 * correct payload shape when constructing or matching a state.
 *
 * State storage strategy:
 *   - Active states (non-idle) are written to Cloudflare KV with a TTL.
 *   - Idle is represented by the *absence* of a KV entry (no wasted writes).
 *   - D1 `onboarding_step` is the cold-start fallback if KV has expired.
 */
export type BotState =
  | { name: "idle" }
  | { name: "onboarding_locale"; pendingRecipientId?: number }
  | { name: "onboarding_name"; pendingRecipientId?: number }
  | { name: "asking_recipient" }
  | { name: "sending_message"; recipientId: number; recipientName: string }

export type StateName = BotState["name"]

/**
 * Allowed transitions.
 * A → B is valid only if B appears in TRANSITIONS[A].
 */
export const TRANSITIONS: Readonly<Record<StateName, StateName[]>> = {
  idle: ["onboarding_locale", "onboarding_name", "sending_message", "asking_recipient"],
  onboarding_locale: ["onboarding_name"],
  onboarding_name: ["idle"],
  asking_recipient: ["sending_message", "idle"],
  sending_message: ["idle"],
}

/**
 * KV expiry per state (seconds).
 * Shorter for active flows so stale state doesn't block users indefinitely.
 */
export const STATE_TTL: Readonly<Record<Exclude<StateName, "idle">, number>> = {
  onboarding_locale: 24 * 60 * 60, // 24 h — resume if user closes and reopens
  onboarding_name: 24 * 60 * 60, // 24 h
  asking_recipient: 5 * 60, // 5 min — short window for recipient resolution
  sending_message: 60 * 60, // 1 h — abandon if user walks away mid-compose
}
