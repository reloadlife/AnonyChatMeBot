import { eq } from "drizzle-orm"
import type { Db } from "~/db/index"
import { type NewUser, type UserModel, users } from "~/db/schema"

export class UserRepository {
  constructor(private readonly db: Db) {}

  async findByTelegramId(telegramId: number): Promise<UserModel | null> {
    const result = await this.db.select().from(users).where(eq(users.telegram_id, telegramId)).get()
    return result ?? null
  }

  async findById(id: number): Promise<UserModel | null> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).get()
    return result ?? null
  }

  /** Insert new user or update username on conflict. Locale and onboarding use schema defaults. */
  async upsert(data: Pick<NewUser, "telegram_id" | "username">): Promise<UserModel> {
    await this.db
      .insert(users)
      .values(data)
      .onConflictDoUpdate({
        target: users.telegram_id,
        set: { username: data.username },
      })
    const user = await this.findByTelegramId(data.telegram_id)
    if (!user) throw new Error("Failed to upsert user")
    return user
  }

  /** Step 1 complete: save chosen locale, advance to step 2 (name entry). */
  async setLocale(id: number, locale: string): Promise<void> {
    await this.db
      .update(users)
      .set({ locale: locale as UserModel["locale"], onboarding_step: 2 })
      .where(eq(users.id, id))
  }

  /** Settings locale change — does NOT advance onboarding_step. */
  async updateLocale(id: number, locale: string): Promise<void> {
    await this.db
      .update(users)
      .set({ locale: locale as UserModel["locale"] })
      .where(eq(users.id, id))
  }

  async setReceivingMessages(id: number, receiving: boolean): Promise<void> {
    await this.db.update(users).set({ receiving_messages: receiving }).where(eq(users.id, id))
  }

  /** Step 2 complete: save display name, mark onboarding done. */
  async completeOnboarding(id: number, displayName: string): Promise<void> {
    await this.db
      .update(users)
      .set({ display_name: displayName, onboarding_step: 0 })
      .where(eq(users.id, id))
  }
}
