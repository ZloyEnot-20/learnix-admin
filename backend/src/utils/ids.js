import { randomBytes } from "node:crypto"

export function uid(prefix = "id") {
  const time = Date.now().toString(36)
  const rand = randomBytes(4).toString("hex").slice(0, 5)
  return `${prefix}_${time}_${rand}`
}
