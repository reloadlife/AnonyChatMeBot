import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { MessageRepository } from "~/repositories/message.repository"

interface MessageJob {
  messageId: number
}

export async function handleMessageQueue(
  batch: MessageBatch<MessageJob>,
  env: Bindings,
): Promise<void> {
  const messageRepo = new MessageRepository(createDb(env.DB))

  for (const msg of batch.messages) {
    const { messageId } = msg.body
    await messageRepo.markDelivered(messageId)
    msg.ack()
  }
}
