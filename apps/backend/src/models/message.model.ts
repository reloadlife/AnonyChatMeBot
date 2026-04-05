export interface MessageModel {
  id: number
  sender_telegram_id: number
  recipient_user_id: number
  content: string
  delivered: 0 | 1
  created_at: string
}
