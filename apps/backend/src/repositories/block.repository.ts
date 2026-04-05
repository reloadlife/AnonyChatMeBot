import { and, eq } from "drizzle-orm"
import type { Db } from "~/db/index"
import { blocks } from "~/db/schema"

export class BlockRepository {
  constructor(private readonly db: Db) {}

  async isBlocked(blockerUserId: number, senderTelegramId: number): Promise<boolean> {
    const result = await this.db
      .select()
      .from(blocks)
      .where(
        and(
          eq(blocks.blocker_user_id, blockerUserId),
          eq(blocks.sender_telegram_id, senderTelegramId),
        ),
      )
      .get()
    return result !== undefined
  }

  async block(blockerUserId: number, senderTelegramId: number): Promise<void> {
    await this.db
      .insert(blocks)
      .values({ blocker_user_id: blockerUserId, sender_telegram_id: senderTelegramId })
      .onConflictDoNothing()
  }
}
