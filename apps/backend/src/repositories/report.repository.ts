import type { Db } from "~/db/index"
import { reports } from "~/db/schema"

export class ReportRepository {
  constructor(private readonly db: Db) {}

  async report(messageId: number, reporterUserId: number): Promise<void> {
    await this.db
      .insert(reports)
      .values({ message_id: messageId, reporter_user_id: reporterUserId })
  }
}
