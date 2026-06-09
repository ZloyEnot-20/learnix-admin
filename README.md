# Learnix Platform Admin

Multi-tenant platform administration — separate from the per-organization admin in `learnix-front`.

## Architecture

**Shared DB + `org_id`** — one MongoDB database, all tenant data scoped by organization:

```
organizations          platform users (this admin)
├── id                 ├── id
├── name               ├── org_id (nullable for platform staff)
├── subdomain          ├── role (super_admin | platform_admin | owner | org_admin)
├── status             └── ...
├── plan (free | pro)
└── limits

subscriptions / payments / audit logs — all linked via org_id
```

This project manages **tenants** (learning centers). The existing `learnix-front` `/admin` is the **organization-level** admin for a single tenant.

## Structure

```
admin/
├── backend/     Express API on :4100
└── front/       Next.js UI on :3001
```

## Quick start

### 1. Backend

```bash
cd admin/backend
cp .env.example .env
npm install
npm run seed    # creates super admin + demo org
npm run dev
```

Default login: `admin@learnix.platform` / `admin123`

### 2. Frontend

```bash
cd admin/front
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3001

## Sections

| Section | Description |
|---------|-------------|
| **Overview** | Org count, trials, revenue, recent activity |
| **Organizations** | Create tenants, block/unblock, plan & limits |
| **Users** | Platform admins + org owners/admins |
| **Billing** | Subscriptions, trials, payments |
| **Logs** | Audit trail + error logs |
| **Configuration** | Default limits, trial days, feature flags |

## API

Base URL: `http://localhost:4100/api`

| Route | Purpose |
|-------|---------|
| `POST /auth/login` | Platform staff login |
| `GET /dashboard` | Metrics |
| `GET/POST/PATCH/DELETE /organizations` | Tenant CRUD |
| `GET/POST/PATCH/DELETE /users` | User management |
| `GET /billing/subscriptions` | Subscriptions |
| `GET/POST /billing/payments` | Payments |
| `GET /audit` | Audit logs |
| `GET /audit/errors` | Error logs |
| `GET/PATCH /config` | Platform config |

## Next steps (integration with learnix)

1. Add `org_id` to existing `learnix-backend` models (User, Group, Payment, etc.)
2. Resolve tenant from subdomain or JWT claim
3. Wire `learnix-front` admin to org-scoped data only
4. Report errors from tenant apps to `POST /audit/errors` (endpoint can be added)
