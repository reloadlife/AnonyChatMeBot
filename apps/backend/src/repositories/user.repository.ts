import type { UserModel } from "../models/user.model"

export class UserRepository {
  constructor(private readonly db: D1Database) {}

  async findByTelegramId(telegramId: number): Promise<UserModel | null> {
    const result = await this.db
      .prepare("SELECT * FROM users WHERE telegram_id = ?")
      .bind(telegramId)
      .first<UserModel>()
    return result ?? null
  }

  async findById(id: number): Promise<UserModel | null> {
    const result = await this.db
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(id)
      .first<UserModel>()
    return result ?? null
  }

  async create(data: Omit<UserModel, "id" | "created_at">): Promise<UserModel> {
    await this.db
      .prepare("INSERT INTO users (telegram_id, username, locale) VALUES (?, ?, ?)")
      .bind(data.telegram_id, data.username, data.locale)
      .run()
    const created = await this.findByTelegramId(data.telegram_id)
    if (!created) throw new Error("Failed to create user")
    return created
  }

  async upsert(data: Omit<UserModel, "id" | "created_at">): Promise<UserModel> {
    await this.db
      .prepare(
        `INSERT INTO users (telegram_id, username, locale)
         VALUES (?, ?, ?)
         ON CONFLICT (telegram_id) DO UPDATE SET username = excluded.username`,
      )
      .bind(data.telegram_id, data.username, data.locale)
      .run()
    const user = await this.findByTelegramId(data.telegram_id)
    if (!user) throw new Error("Failed to upsert user")
    return user
  }
}
