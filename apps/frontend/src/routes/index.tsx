import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">Anonymous messaging</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Say it without fear.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          AnonyChatMe lets you receive anonymous messages via Telegram. Share your link — your
          identity stays protected, forever.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://t.me/AnonyChatMeBot"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[var(--lagoon-deep)] px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-[var(--lagoon)]"
          >
            Open in Telegram
          </a>
          <a
            href="https://github.com/reloadlife/AnonyChatMeBot"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-[rgba(23,58,64,0.2)] bg-white/50 px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[rgba(23,58,64,0.35)]"
          >
            View on GitHub
          </a>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Truly Anonymous", "Your senders are never identified. No Telegram ID, no username — just messages."],
          ["Secure Delivery", "Messages travel through Cloudflare Workers with queue-based delivery and retry logic."],
          ["Media Support", "Receive photos, videos, voice notes, documents, and more — not just text."],
          ["Block & Report", "Full control: block senders, report abuse, and delete messages you don't want."],
          ["Multilingual", "Available in English, Persian, Russian, German, French, and Arabic."],
          ["Open Source", "Fully open source and self-hostable. Build on it, fork it, own it."],
        ].map(([title, desc], index) => (
          <article
            key={title}
            className="island-shell feature-card rise-in rounded-2xl p-5"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">{title}</h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
