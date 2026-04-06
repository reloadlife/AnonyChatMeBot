import { eq } from "drizzle-orm"
import type { Db } from "~/db/index"
import { type ReportModel, reports } from "~/db/schema"

export class ReportRepository {
  constructor(private readonly db: Db) {}

  async report(messageId: number, reporterUserId: number): Promise<void> {
    await this.db
      .insert(reports)
      .values({ message_id: messageId, reporter_user_id: reporterUserId })
      .onConflictDoNothing()
  }

  async listPending(): Promise<ReportModel[]> {
    return this.db.select().from(reports).where(eq(reports.dismissed, false)).all()
  }

  async dismiss(id: number): Promise<void> {
    await this.db.update(reports).set({ dismissed: true }).where(eq(reports.id, id))
  }
}
