import type { MessageModel } from "../models/message.model"

export class MessageRepository {
  constructor(private readonly db: D1Database) {}

  async create(data: Omit<MessageModel, "id" | "created_at">): Promise<MessageModel> {
    const result = await this.db
      .prepare(
        `INSERT INTO messages (sender_telegram_id, recipient_user_id, content, delivered)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(data.sender_telegram_id, data.recipient_user_id, data.content, 0)
      .run()
    const id = result.meta.last_row_id
    const created = await this.findById(id)
    if (!created) throw new Error("Failed to create message")
    return created
  }

  async findById(id: number): Promise<MessageModel | null> {
    const result = await this.db
      .prepare("SELECT * FROM messages WHERE id = ?")
      .bind(id)
      .first<MessageModel>()
    return result ?? null
  }

  async findByRecipient(recipientUserId: number): Promise<MessageModel[]> {
    const result = await this.db
      .prepare("SELECT * FROM messages WHERE recipient_user_id = ? ORDER BY created_at DESC")
      .bind(recipientUserId)
      .all<MessageModel>()
    return result.results
  }

  async markDelivered(id: number): Promise<void> {
    await this.db.prepare("UPDATE messages SET delivered = 1 WHERE id = ?").bind(id).run()
  }
}
