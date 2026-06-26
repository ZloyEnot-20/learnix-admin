import { z } from "zod"

export const idParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
})

export const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(1) }),
})

const subdomainField = z
  .string()
  .min(2)
  .max(63)
  .regex(/^[a-z0-9-]+$/, "Subdomain: lowercase letters, numbers, hyphens only")

const ownerLoginField = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9._-]+$/, "Login: lowercase letters, numbers, dots, underscores, hyphens")

export const createOrgSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    subdomain: subdomainField,
    plan: z.enum(["free", "pro"]).optional(),
    trialDays: z.number().int().min(0).max(90).optional(),
    limits: z
      .object({
        maxStudents: z.number().int().min(0),
        maxTeachers: z.number().int().min(0),
      })
      .optional(),
    ownerName: z.string().min(1).optional(),
    ownerLogin: ownerLoginField.optional(),
  }),
})

export const registerOrgSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    subdomain: subdomainField,
    ownerName: z.string().min(1).max(120),
    ownerLogin: ownerLoginField,
  }),
})

export const updateOrgSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z
    .object({
      name: z.string().min(1).max(120).optional(),
      status: z.enum(["active", "blocked"]).optional(),
      plan: z.enum(["free", "pro"]).optional(),
      limits: z
        .object({
          maxStudents: z.number().int().min(0),
          maxTeachers: z.number().int().min(0),
        })
        .optional(),
      trialEndsAt: z.string().datetime().nullable().optional(),
      notes: z.string().max(2000).nullable().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: "Empty update" }),
})

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().min(1).max(120),
    password: z.string().min(6),
    role: z.enum(["platform_admin", "owner", "org_admin"]),
    orgId: z.string().min(1).nullable().optional(),
  }),
})

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z
    .object({
      name: z.string().min(1).max(120).optional(),
      role: z.enum(["platform_admin", "owner", "org_admin"]).optional(),
      orgId: z.string().min(1).nullable().optional(),
      isActive: z.boolean().optional(),
      password: z.string().min(6).optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: "Empty update" }),
})

export const updateSubscriptionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    plan: z.enum(["free", "pro"]).optional(),
    status: z.enum(["trialing", "active", "past_due", "canceled"]).optional(),
    trialEndsAt: z.string().datetime().nullable().optional(),
    currentPeriodEnd: z.string().datetime().nullable().optional(),
  }),
})

export const createPaymentSchema = z.object({
  body: z.object({
    orgId: z.string().min(1),
    amount: z.number().min(0),
    currency: z.string().length(3).optional(),
    periodLabel: z.string().min(1),
    status: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
    notes: z.string().max(500).optional(),
  }),
})

export const updateConfigSchema = z.object({
  body: z.object({
    defaultLimits: z
      .object({
        free: z.object({ maxStudents: z.number().int().min(0), maxTeachers: z.number().int().min(0) }),
        pro: z.object({ maxStudents: z.number().int().min(0), maxTeachers: z.number().int().min(0) }),
      })
      .optional(),
    trialDays: z.number().int().min(0).max(365).optional(),
    featureFlags: z.record(z.boolean()).optional(),
  }),
})

export const auditQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    category: z.string().optional(),
    orgId: z.string().optional(),
  }),
})

export const errorLogQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    level: z.enum(["error", "warn", "info"]).optional(),
    orgId: z.string().optional(),
  }),
})

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(5000),
    type: z.enum(["news", "maintenance"]).optional(),
    severity: z.enum(["info", "warning", "critical"]).optional(),
    targetOrgIds: z.array(z.string().min(1)).nullable().optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
})

export const updateAnnouncementSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z
    .object({
      title: z.string().min(1).max(200).optional(),
      message: z.string().min(1).max(5000).optional(),
      type: z.enum(["news", "maintenance"]).optional(),
      severity: z.enum(["info", "warning", "critical"]).optional(),
      targetOrgIds: z.array(z.string().min(1)).nullable().optional(),
      startsAt: z.string().datetime().optional(),
      endsAt: z.string().datetime().nullable().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: "Empty update" }),
})

export const updateIssueReportSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    status: z.enum(["open", "resolved", "dismissed"]),
  }),
})
