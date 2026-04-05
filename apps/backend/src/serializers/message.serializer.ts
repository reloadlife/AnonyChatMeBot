import type { MessageModel } from "../models/message.model"

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
    delivered: message.delivered === 1,
    createdAt: message.created_at,
  }
}

export function serializeMessages(messages: MessageModel[]): SerializedMessage[] {
  return messages.map(serializeMessage)
}
