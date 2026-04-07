# AnonyChatMeBot — Social-First UX Overhaul

**Date:** 2026-04-07
**Status:** Draft
**Audience:** Young/social users (teens & young adults sharing on Instagram stories, Twitter bios, etc.)

## Context

AnonyChatMeBot is a working anonymous messaging Telegram bot with 6 languages, media support, web sender, rate limiting, and admin tools. However, the current UX feels mechanical and lifeless — bot messages read like system notifications, onboarding is forgettable, replies have no threading, sharing is just a plain link, and the inbox is a flat list. For an app targeting young social users, personality and viral hooks are everything. This overhaul redesigns the experience around a core loop: **share → receive → engage → share again**.

## Design Principles

- **Every message sounds like a friend, not a machine** — casual, bold, Gen-Z energy
- **Mystery builds anticipation** — received message notifications should create excitement
- **Errors are helpful, never cold** — friendly tone with actionable guidance
- **Localize the vibe, not just the words** — all 6 languages carry the same personality
- **Privacy is sacred** — threading and reactions never leak identity

---

## Phase 1: Copy & Soul

**Goal:** Rewrite all bot text to have bold, Gen-Z personality. Highest impact, lowest effort.

### Tone Guide

- Lowercase-casual where appropriate (not ALL CAPS screaming)
- Emoji as punctuation and personality, not decoration
- Mystery/anticipation for received messages
- Friendly roasting energy for errors
- Hype energy for stats and milestones

### Key Rewrites

| Context | Current | New |
|---------|---------|-----|
| Message sent | `✅ *Sent!* Your message was delivered.` | `💌 *sent & sealed* 🤫 they'll never know it was you` |
| New message received | `📩 *New anonymous message!*` | `👀 *oop— someone just dropped a secret in your inbox* 🔥 tap to see what they said` |
| Invalid link | `❌ *Invalid link.* Please check it and try again.` | `😬 nah that link's not it. copy-paste the real one and try again` |
| Rate limited | `⏳ *Slow down!*` | `😮‍💨 chill— try again in {seconds}s` |
| Nothing to cancel | `🤷 You're not in the middle of anything.` | `😎 you're all clear — nothing to cancel!` |
| Welcome | (plain) | `🎭 *yo, welcome to AnonyChatMeBot* ✨ where people say what they *actually* think. share your link → get anonymous messages → find out the tea 🍵` |
| Stats | (plain numbers) | `📊 *your vibe check:* 💌 {received} received 🔥 {unread} unread 📤 {sent} sent — you're kinda popular ngl 👀` |
| User not found | `❌ User not found.` | `🫠 couldn't find that person. maybe they deleted their account?` |
| Self-message | `❌ You can't send an anonymous message to yourself.` | `😂 you trying to message yourself? we've all been there but nah` |
| Message too long | `❌ *Message too long*` | `📝 too much to say! keep it under 4000 characters` |
| Media rejected | `❌ *This user doesn't accept this type of media.*` | `🚫 they don't accept this type of media. try sending text instead!` |
| Not accepting | `❌ *Not accepting messages.*` | `😴 their inbox is closed rn. try again later!` |
| Fallback | `I didn't understand.` | `🤔 didn't catch that. tap a button or type /help if you're lost!` |
| Blocked | `Sender blocked.` | `🚫 blocked. you won't hear from them again` |
| Reported | (plain) | `🚩 reported. we'll look into it` |
| Deleted | (plain) | `🗑️ gone. poof. like it never happened` |
| Empty inbox | (no messages) | `📭 *nothing here yet...* share your link and see what happens 👀` |

### Onboarding Text Updates

1. Welcome splash: `🎭 *yo, welcome to AnonyChatMeBot* ✨ where people say what they *actually* think`
2. Language picker header: `🌍 pick your language`
3. Name prompt: `💬 what name should people see when they visit your page?`
4. Post-setup: Show link immediately with share-ready text

### Files to Modify

- `packages/shared/src/i18n/locales/en.yaml` — English strings
- `packages/shared/src/i18n/locales/fa.yaml` — Persian strings
- `packages/shared/src/i18n/locales/ru.yaml` — Russian strings
- `packages/shared/src/i18n/locales/de.yaml` — German strings
- `packages/shared/src/i18n/locales/fr.yaml` — French strings
- `packages/shared/src/i18n/locales/ar.yaml` — Arabic strings

### Error Message Improvements

- All errors include what went wrong + what to do next
- Rate limit shows remaining seconds (already calculated in `rate-limit.ts`, just not shown)
- Pass `retryAfter` value through to i18n template: `{seconds}s`

---

## Phase 2: Inbox & Replies

**Goal:** Make the inbox feel alive and enable real anonymous conversations.

### Inbox Improvements

#### Message Previews
- Show first ~50 characters of message content in inbox list
- Truncate with "..." if longer
- Media-only messages show type indicator: "📷 Photo", "🎥 Video", "🎤 Voice", etc.

#### Unread Indicators
- Unread messages prefixed with 🔴 (or bold)
- Read messages show normally
- Unread count shown in inbox header: `📬 *inbox* (3 unread)`

#### Time-Ago Formatting
- Already partially exists in i18n (`inbox.time_ago.*`)
- Ensure consistent formatting: "2m ago", "1h ago", "yesterday", "3d ago"
- Use relative time for <7 days, then date

#### Mark All as Read
- Button at top of inbox: `✅ mark all as read`
- Callback: `mark_all_read`
- Updates all unread messages for user in single DB query

#### Empty Inbox State
- When no messages: show personality text + share button
- `📭 *nothing here yet...* share your link and see what happens 👀`
- Inline button: `📩 share my link`

### Reply Threading

#### How It Works
1. Recipient taps "Reply" on a message
2. State set to `replying_to` with `reply_to_id` stored
3. User types reply
4. Reply saved with `reply_to_id` pointing to original message
5. Sender receives reply with quoted context:
   ```
   💬 *reply to your message:*
   > "{first 100 chars of original}..."

   {reply content}
   ```
6. Sender can reply back → new message with `reply_to_id` pointing to the reply
7. Chain continues indefinitely

#### Privacy
- Neither side learns the other's identity at any point
- The `reply_to_id` chain only provides message context, never user identity
- Quoted snippets are content-only

#### Data Model
- `messages.reply_to_id` already exists in schema (currently unused) → activate it
- No schema changes needed

#### Files to Modify
- `apps/backend/src/bot/handlers/message-actions.handler.ts` — reply action handler
- `apps/backend/src/views/telegram/message.handler.ts` — include reply context in delivery
- `apps/backend/src/controllers/message.controller.ts` — thread context lookup
- `apps/backend/src/bot/commands/inbox.ts` — previews, unread indicators, time-ago, mark-all-read
- `apps/backend/src/repositories/message.repository.ts` — mark-all-read query, preview query

---

## Phase 3: Sharing & Virality

**Goal:** Make links look great when shared and easy to distribute.

### Rich Link Previews (OG Tags)
- `/s/{hash}` web page gets proper OG meta tags:
  - `og:title`: "{displayName} — send me an anonymous message 👀"
  - `og:description`: "say something you'd never say to my face. completely anonymous."
  - `og:image`: Static branded image stored in `public/` — bot logo with tagline "send me an anonymous message". Same image for all users (no per-user generation needed).
  - `og:type`: "website"
  - `twitter:card`: "summary_large_image"
- These make links look rich when shared on Twitter, Discord, Instagram link-in-bio, etc.

### Redesigned Web Landing Page (`/s/{hash}`)
- Mobile-first design matching bot personality
- Large display name
- Engaging CTA: "send them an anonymous message 👀"
- Textarea with character count
- Send button with loading state
- Success screen: "💌 sent! they'll never know it was you 🤫"
- Error states with friendly copy matching bot tone

### Share Menu in Telegram
When user taps "📩 My link" or `/link`:
- Show the link (copyable code block)
- Pre-written share text: `👀 send me something anonymous — i dare you {link}`
- Inline button: "📤 share" (Telegram native share sheet)
- Keep it simple — no QR codes or prompt cards in this phase

### Files to Modify
- `apps/frontend/src/routes/s.$hash.tsx` — redesign send page
- `apps/frontend/src/routes/index.tsx` — landing page updates
- `apps/backend/src/bot/commands/link.ts` — share menu with pre-written text
- Frontend meta tags / head configuration

---

## Phase 4: Engagement & Polish

**Goal:** Add engagement hooks and fix remaining UX rough edges.

### Emoji Reactions
- After viewing a message, show reaction buttons below message actions:
  `❤️  😂  😮  🙏`
- One reaction per message per recipient
- Sender gets notified: `💬 someone reacted ❤️ to your message: "{snippet}..."`
- Reaction stored in DB (new field or table)

#### Data Model Option
Add to `messages` table:
- `reaction` (text, nullable) — emoji string, null = no reaction

Or create `reactions` table if we want to support reactions from both sides:
- `id`, `message_id`, `reactor_telegram_id`, `emoji`, `created_at`

**Recommendation:** Simple `reaction` column on `messages` — only the recipient reacts, one reaction per message. YAGNI.

### Block Confirmation
- Before blocking: `🚫 block this sender? you won't get their messages anymore.` with `Yes, block` / `Cancel` buttons
- After blocking: `🚫 blocked. you won't hear from them again`

### Media Settings Quick Toggles
- Add two buttons at top of media settings menu:
  - `✅ allow all` — enables all media types
  - `❌ deny all` — disables all media types
- Below: individual toggles (existing behavior)

### Rate Limit Countdown
- Show remaining wait time in rate limit message
- `retryAfter` already calculated in `rate-limit.ts`
- Pass seconds to i18n template

### Settings Display
- Show current values in settings menu buttons:
  - `🌐 Language: English`
  - `✏️ Name: {displayName}`
  - `📩 Receiving: ✅ on` / `📩 Receiving: ❌ off`

### Blocked List Improvement
- Show blocked count in header: `🚫 blocked senders ({count})`
- Show blocked date: `🗑 Blocked on {date}`
- If no blocks: `✨ no one's blocked — you're vibing with everyone`

### Files to Modify
- `apps/backend/src/bot/handlers/message-actions.handler.ts` — reactions, block confirmation
- `apps/backend/src/db/schema.ts` — add `reaction` column to messages
- `apps/backend/src/bot/commands/settings.ts` — current values, media toggles
- `apps/backend/src/utils/media-prefs.ts` — allow-all / deny-all helpers
- `apps/backend/src/views/telegram/message.handler.ts` — reaction notifications

---

## Verification Plan

### Phase 1 (Copy)
- Read all 6 YAML locale files and verify new strings
- Run `bun run dev:bot` and test each command for updated copy
- Test error cases: invalid link, rate limit, self-message, media rejection
- Test onboarding flow end-to-end with new text

### Phase 2 (Inbox & Replies)
- Send multiple messages, verify inbox shows previews and unread indicators
- Test time-ago formatting across ranges (minutes, hours, days)
- Test "mark all as read" button
- Test reply: send message → recipient replies → sender sees quoted context
- Test multi-level reply chain (3+ exchanges)
- Test reply with media (photo reply to text, etc.)

### Phase 3 (Sharing)
- Open `/s/{hash}` in browser, verify OG tags with [OG debugger tools]
- Share link on Twitter/Discord, verify rich preview card renders
- Test share menu: copy link, native share button, pre-written text
- Test web send form end-to-end (type message → send → confirmation)

### Phase 4 (Engagement)
- Test reaction flow: receive message → view → react → sender gets notification
- Test block confirmation dialog (yes → blocked, cancel → returns)
- Test media "allow all" / "deny all" toggles
- Test rate limit countdown shows seconds
- Test settings menu shows current values
- Test blocked list with dates and empty state
