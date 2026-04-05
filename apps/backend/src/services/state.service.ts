import type { UserModel } from "~/db/schema"
import { type BotState, STATE_TTL, type StateName, TRANSITIONS } from "~/models/state.model"

export class StateService {
  constructor(private readonly kv: KVNamespace) {}

  private key(telegramId: number): string {
    return `state:${telegramId}`
  }

  /**
   * Get the current state for a user.
   *
   * Resolution order:
   *   1. KV cache (fast path, has TTL)
   *   2. D1 onboarding_step (cold-start recovery — KV expired or first run)
   *   3. Default: idle
   */
  async get(telegramId: number, user?: UserModel | null): Promise<BotState> {
    const raw = await this.kv.get(this.key(telegramId))
    if (raw) return JSON.parse(raw) as BotState

    // Cold-start recovery from persistent DB state
    if (user?.onboarding_step === 1) return { name: "onboarding_locale" }
    if (user?.onboarding_step === 2) return { name: "onboarding_name" }
    return { name: "idle" }
  }

  /**
   * Transition to a new state, validating against the FSM transition map.
   * Throws if the transition is not allowed.
   */
  async transition(telegramId: number, next: BotState): Promise<BotState> {
    const current = await this.get(telegramId)
    const allowed = TRANSITIONS[current.name]

    if (!allowed.includes(next.name)) {
      throw new Error(
        `[FSM] Invalid transition: "${current.name}" → "${next.name}" for user ${telegramId}`,
      )
    }

    await this.set(telegramId, next)
    return next
  }

  /**
   * Write state directly, bypassing transition validation.
   * Use for resets and initialisation; prefer transition() for normal flows.
   */
  async set(telegramId: number, state: BotState): Promise<void> {
    if (state.name === "idle") {
      // Idle = no active flow — removing the entry is cheaper and semantically cleaner
      await this.kv.delete(this.key(telegramId))
      return
    }

    const ttl = STATE_TTL[state.name as Exclude<StateName, "idle">]
    await this.kv.put(this.key(telegramId), JSON.stringify(state), {
      expirationTtl: ttl,
    })
  }

  /** Remove the state entry — equivalent to transitioning to idle. */
  async reset(telegramId: number): Promise<void> {
    await this.kv.delete(this.key(telegramId))
  }
}
