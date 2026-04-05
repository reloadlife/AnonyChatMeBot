import type { MessageModel } from "~/db/schema"

export interface SerializedMessage {
  id: number
  content: string
  delivered: boolean
  createdAt: string
}

export function serializeMessage(message: MessageModel): SerializedMessage {
  return {
    id: message.id,
    content: message.content,
    delivered: message.delivered,
    createdAt: message.created_at,
  }
}
