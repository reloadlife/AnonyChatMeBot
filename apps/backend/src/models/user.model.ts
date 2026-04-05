export interface UserModel {
  id: number
  telegram_id: number
  username: string | null
  locale: "en" | "fa"
  created_at: string
}
