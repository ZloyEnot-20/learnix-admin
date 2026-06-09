import "../config/mongoose.js"
import { PlatformUser } from "../models/PlatformUser.js"
import { Organization } from "../models/Organization.js"
import { Subscription } from "../models/Subscription.js"
import { PlatformConfig } from "../models/PlatformConfig.js"
import { hashPassword } from "../utils/password.js"
import { env } from "../config/env.js"

await PlatformConfig.findByIdAndUpdate(
  "platform",
  { _id: "platform" },
  { upsert: true, setDefaultsOnInsert: true },
)

const existing = await PlatformUser.findOne({ email: env.seed.adminEmail.toLowerCase() })
if (!existing) {
  await PlatformUser.create({
    email: env.seed.adminEmail.toLowerCase(),
    name: "Platform Super Admin",
    passwordHash: await hashPassword(env.seed.adminPassword),
    role: "super_admin",
  })
  console.log(`[seed] super admin: ${env.seed.adminEmail}`)
} else {
  console.log("[seed] super admin already exists")
}

const demoOrg = await Organization.findOne({ subdomain: "demo" })
if (!demoOrg) {
  const org = await Organization.create({
    name: "Demo Learning Center",
    subdomain: "demo",
    plan: "pro",
    limits: { maxStudents: 200, maxTeachers: 20 },
    trialEndsAt: new Date(Date.now() + 14 * 86400000),
  })
  await Subscription.create({
    orgId: org._id,
    plan: "pro",
    status: "trialing",
    trialEndsAt: org.trialEndsAt,
    currentPeriodStart: new Date(),
    currentPeriodEnd: org.trialEndsAt,
  })
  await PlatformUser.create({
    email: "demo_owner@demo.learnix",
    login: "demo_owner",
    name: "Demo Owner",
    passwordHash: await hashPassword("demo123"),
    role: "owner",
    orgId: org._id,
  })
  console.log("[seed] demo organization: demo.learnix")
}

console.log("[seed] done")
