/**
 * Learnix Platform Admin Telegram bot — delivers org owner credentials
 * after a one-time 6-digit confirmation code is entered.
 *
 * Run: npm run bot
 */
import "../config/mongoose.js"
import { env } from "../config/env.js"
import { OwnerClaim } from "../models/OwnerClaim.js"
import { PlatformUser } from "../models/PlatformUser.js"
import { Organization } from "../models/Organization.js"
import { sendMessage, esc } from "../services/telegram.service.js"

const TOKEN = env.telegram.botToken
const CLAIM_CODE_RE = /^\d{6}$/

const BTN_ORG = "🏢 Men tashkilotman"
const ROLE_KEYBOARD = {
  keyboard: [[{ text: BTN_ORG }]],
  resize_keyboard: true,
  is_persistent: true,
}

const MAX_ATTEMPTS = 5
const ATTEMPT_WINDOW_MS = 60_000
const attempts = new Map()

function tooManyAttempts(chatId) {
  const now = Date.now()
  const rec = attempts.get(chatId)
  if (!rec || now - rec.windowStart > ATTEMPT_WINDOW_MS) {
    attempts.set(chatId, { count: 1, windowStart: now })
    return false
  }
  rec.count += 1
  return rec.count > MAX_ATTEMPTS
}

function resetAttempts(chatId) {
  attempts.delete(chatId)
}

async function redeemOwnerClaim(chatId, rawCode) {
  const code = String(rawCode ?? "").replace(/\D/g, "")
  if (!CLAIM_CODE_RE.test(code)) {
    await sendMessage(
      chatId,
      "❌ This doesn't look like a 6-digit code. Send the code from the platform admin (e.g. <code>048213</code>).",
    )
    return
  }

  const claim = await OwnerClaim.findOne({ code, usedAt: null }).select("+password")
  if (!claim) {
    await sendMessage(chatId, "❌ Code not found or already used. Contact the platform administrator.")
    return
  }
  if (new Date(claim.expiresAt).getTime() < Date.now()) {
    await sendMessage(chatId, "⌛ This code has expired. Request a new one from the platform administrator.")
    return
  }

  const [owner, org] = await Promise.all([
    PlatformUser.findById(claim.ownerId),
    Organization.findById(claim.orgId),
  ])
  if (!owner || owner.role !== "owner") {
    await sendMessage(chatId, "❌ Owner account not found. Contact the platform administrator.")
    return
  }

  const password = claim.password
  claim.usedAt = new Date()
  claim.usedByChatId = chatId
  claim.password = null
  await claim.save()

  resetAttempts(chatId)

  const login = owner.login ?? owner.email
  const orgLabel = org ? `${org.name} (${org.subdomain}.learnix)` : "your organization"

  await sendMessage(
    chatId,
    [
      "🔑 <b>Organization owner credentials</b>",
      "",
      `🏢 ${esc(orgLabel)}`,
      `👤 ${esc(owner.name)}`,
      `Login: <code>${esc(login)}</code>`,
      `Password: <code>${esc(password)}</code>`,
      "",
      "Sign in with these credentials. Do not share your password.",
    ].join("\n"),
  )
}

async function handleUpdate(update) {
  const msg = update.message
  if (!msg?.text) return

  const chatId = msg.chat.id
  const text = msg.text.trim()

  if (text === "/start") {
    await sendMessage(
      chatId,
      [
        "👋 <b>Learnix Platform</b>",
        "",
        "Tap <b>Men tashkilotman</b> below, then send the 6-digit confirmation code",
        "you received when your organization was created.",
        "You will receive your login and password here.",
      ].join("\n"),
      { reply_markup: ROLE_KEYBOARD },
    )
    return
  }

  if (text === BTN_ORG) {
    await sendMessage(
      chatId,
      [
        "🏢 <b>Organization</b>",
        "",
        "Send the 6-digit confirmation code from the platform administrator",
        "(e.g. <code>048213</code>).",
      ].join("\n"),
      { reply_markup: ROLE_KEYBOARD },
    )
    return
  }

  if (text === "/help") {
    await sendMessage(chatId, "Send your 6-digit confirmation code to receive owner credentials.")
    return
  }

  if (tooManyAttempts(chatId)) {
    await sendMessage(chatId, "⏳ Too many attempts. Wait a minute and try again.")
    return
  }

  await redeemOwnerClaim(chatId, text)
}

async function poll() {
  if (!TOKEN) {
    console.error("[platform-bot] TELEGRAM_BOT_TOKEN is not set")
    process.exit(1)
  }

  let offset = 0
  console.log("[platform-bot] polling started")

  while (true) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ offset, timeout: 30 }),
      })
      const data = await res.json()
      if (!data.ok) {
        console.error("[platform-bot] getUpdates failed:", data.description)
        await new Promise((r) => setTimeout(r, 5000))
        continue
      }
      for (const update of data.result) {
        offset = update.update_id + 1
        handleUpdate(update).catch((err) => console.error("[platform-bot] handle error:", err.message))
      }
    } catch (err) {
      console.error("[platform-bot] poll error:", err.message)
      await new Promise((r) => setTimeout(r, 5000))
    }
  }
}

poll()
