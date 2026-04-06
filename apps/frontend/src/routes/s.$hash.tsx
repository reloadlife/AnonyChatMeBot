import { createFileRoute, useParams } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { useState } from "react"

const API_BASE = import.meta.env.VITE_API_URL ?? ""
const API_SECRET = import.meta.env.VITE_API_SECRET ?? ""

const resolveUser = createServerFn({ method: "GET" })
  .inputValidator((hash: string) => hash)
  .handler(async ({ data: hash }) => {
    const res = await fetch(`${API_BASE}/api/users/resolve/${hash}`, {
      headers: { "X-API-Secret": API_SECRET },
    })
    if (!res.ok) return null
    return res.json() as Promise<{ id: number; displayName: string }>
  })

const sendMessage = createServerFn({ method: "POST" })
  .inputValidator((data: { hash: string; content: string }) => data)
  .handler(async ({ data }) => {
    const userRes = await fetch(`${API_BASE}/api/users/resolve/${data.hash}`, {
      headers: { "X-API-Secret": API_SECRET },
    })
    if (!userRes.ok) throw new Error("User not found")
    const user = (await userRes.json()) as { id: number }

    const res = await fetch(`${API_BASE}/api/messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Secret": API_SECRET },
      body: JSON.stringify({
        senderTelegramId: 0,
        recipientUserId: user.id,
        content: data.content,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to send" }))
      throw new Error((err as { error: string }).error ?? "Failed to send")
    }
    return true
  })

export const Route = createFileRoute("/s/$hash")({
  component: SendPage,
  loader: async ({ params }) => resolveUser({ data: params.hash }),
})

function SendPage() {
  const { hash } = useParams({ from: "/s/$hash" })
  const recipient = Route.useLoaderData()
  const [text, setText] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  if (!recipient) {
    return (
      <main className="page-wrap px-4 pt-20 text-center">
        <p className="text-2xl">🔗 Invalid link</p>
        <p className="text-[var(--sea-ink-soft)] mt-2">
          This link is invalid or the user no longer exists.
        </p>
      </main>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || status === "sending") return
    setStatus("sending")
    try {
      await sendMessage({ data: { hash, content: text.trim() } })
      setStatus("sent")
    } catch (err) {
      setErrorMsg((err as Error).message)
      setStatus("error")
    }
  }

  if (status === "sent") {
    return (
      <main className="page-wrap px-4 pt-20 text-center">
        <p className="text-4xl mb-4">✅</p>
        <h1 className="text-2xl font-bold text-[var(--sea-ink)] mb-2">Message sent!</h1>
        <p className="text-[var(--sea-ink-soft)]">Your anonymous message was delivered.</p>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14 max-w-xl mx-auto">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <p className="island-kicker mb-3">Anonymous message</p>
        <h1 className="display-title mb-2 text-3xl font-bold tracking-tight text-[var(--sea-ink)]">
          Send to <span className="text-[var(--lagoon-deep)]">{recipient.displayName}</span>
        </h1>
        <p className="mb-8 text-sm text-[var(--sea-ink-soft)]">
          Your identity will never be revealed.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message here…"
            maxLength={4000}
            rows={5}
            className="w-full rounded-2xl border border-[var(--line)] bg-white/60 p-4 text-[var(--sea-ink)] placeholder-[var(--sea-ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--lagoon)] resize-none"
          />
          <div className="flex items-center justify-between text-xs text-[var(--sea-ink-soft)]">
            <span>{text.length}/4000</span>
            {status === "error" && <span className="text-red-500">{errorMsg}</span>}
          </div>
          <button
            type="submit"
            disabled={!text.trim() || status === "sending"}
            className="rounded-full bg-[var(--lagoon-deep)] px-6 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--lagoon)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "sending" ? "Sending…" : "Send anonymously"}
          </button>
        </form>
      </section>
    </main>
  )
}
