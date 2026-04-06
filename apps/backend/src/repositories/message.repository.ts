import { and, count, desc, eq, isNull, lt } from "drizzle-orm"
import type { Db } from "~/db/index"
import { type MessageModel, messages, type NewMessage } from "~/db/schema"

export class MessageRepository {
  constructor(private readonly db: Db) {}

  async create(data: NewMessage): Promise<MessageModel> {
    const result = await this.db.insert(messages).values(data).returning().get()
    if (!result) throw new Error("Failed to create message")
    return result
  }

  async findById(id: number): Promise<MessageModel | null> {
    const result = await this.db.select().from(messages).where(eq(messages.id, id)).get()
    return result ?? null
  }

  async findByRecipient(recipientUserId: number): Promise<MessageModel[]> {
    return this.db
      .select()
      .from(messages)
      .where(eq(messages.recipient_user_id, recipientUserId))
      .orderBy(desc(messages.created_at))
  }

  async markDelivered(id: number): Promise<void> {
    await this.db.update(messages).set({ delivered: true }).where(eq(messages.id, id))
  }

  async setNotificationMessageId(id: number, notificationMessageId: number): Promise<void> {
    await this.db
      .update(messages)
      .set({ notification_message_id: notificationMessageId })
      .where(eq(messages.id, id))
  }

  async markRead(id: number): Promise<void> {
    await this.db
      .update(messages)
      .set({ read_at: new Date().toISOString() })
      .where(eq(messages.id, id))
  }

  async softDelete(id: number): Promise<void> {
    await this.db
      .update(messages)
      .set({ deleted_at: new Date().toISOString() })
      .where(eq(messages.id, id))
  }

  async countByRecipient(recipientUserId: number): Promise<number> {
    const result = await this.db
      .select({ n: count() })
      .from(messages)
      .where(and(eq(messages.recipient_user_id, recipientUserId), isNull(messages.deleted_at)))
      .get()
    return result?.n ?? 0
  }

  async countUnread(recipientUserId: number): Promise<number> {
    const result = await this.db
      .select({ n: count() })
      .from(messages)
      .where(
        and(
          eq(messages.recipient_user_id, recipientUserId),
          isNull(messages.read_at),
          isNull(messages.deleted_at),
        ),
      )
      .get()
    return result?.n ?? 0
  }

  async countBySender(senderTelegramId: number): Promise<number> {
    const result = await this.db
      .select({ n: count() })
      .from(messages)
      .where(eq(messages.sender_telegram_id, senderTelegramId))
      .get()
    return result?.n ?? 0
  }

  /** Delete messages older than the given number of days. Returns rows affected. */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const result = await this.db
      .delete(messages)
      .where(lt(messages.created_at, cutoff))
      .returning({ id: messages.id })
    return result.length
  }
}
