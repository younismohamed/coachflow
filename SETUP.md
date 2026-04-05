# CoachFlow — Complete Setup & Deployment Guide

## Prerequisites
- Node.js 18+
- A Supabase account (supabase.com)
- A Vercel account (vercel.com)
- A Resend account (resend.com)
- A Google Cloud account (for OAuth)

---

## STEP 1 — Create the Next.js Project

```bash
npx create-next-app@latest coachflow \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint

cd coachflow
```

Install dependencies:
```bash
npm install @supabase/ssr @supabase/supabase-js resend date-fns react-hook-form zod
```

---

## STEP 2 — Supabase Project Setup

1. Go to https://supabase.com → New Project
2. Note your **Project URL** and **Anon Key** (Settings → API)
3. Also note your **Service Role Key** (keep this secret!)

### Run the SQL Schema
In Supabase Dashboard → SQL Editor:

1. Run `supabase/schema.sql` (creates tables + triggers)
2. Run `supabase/rls-policies.sql` (enables RLS + policies)

---

## STEP 3 — Google OAuth Setup

### In Google Cloud Console:
1. Go to https://console.cloud.google.com
2. Create a new project (or use existing)
3. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
4. Application type: **Web application**
5. Add Authorized redirect URIs:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
6. Copy the **Client ID** and **Client Secret**

### In Supabase Dashboard:
1. Authentication → Providers → Google
2. Enable Google provider
3. Paste your Client ID and Client Secret
4. Save

---

## STEP 4 — Resend Email Setup

1. Go to https://resend.com → Sign up
2. Add & verify your sending domain (DNS records)
3. API Keys → Create API Key
4. Copy the key — you'll use it as `RESEND_API_KEY`
5. Set `RESEND_FROM_EMAIL` to a verified address e.g. `coaching@yourcompany.com`

---

## STEP 5 — Environment Variables

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_APP_URL=http://localhost:3000

RESEND_API_KEY=re_your_resend_key
RESEND_FROM_EMAIL=coaching@yourcompany.com

CRON_SECRET=generate-random-32-chars-here
```

Generate CRON_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## STEP 6 — Copy Source Files

Copy all source files from this repository into your project:
```
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    login/page.tsx
    auth/
      callback/route.ts
      signout/route.ts
    dashboard/
      layout.tsx
      page.tsx
      coaching/
        page.tsx
        new/page.tsx
        [id]/page.tsx
        [id]/edit/page.tsx
      employees/
        page.tsx
        new/page.tsx
        [id]/page.tsx
        [id]/edit/page.tsx
      admin/page.tsx
    api/
      coaching/route.ts
      coaching/[id]/route.ts
      employees/route.ts
      employees/[id]/route.ts
      admin/users/[id]/route.ts
      cron/reminders/route.ts
    acknowledge/[token]/page.tsx
  components/
    auth/GoogleLoginButton.tsx
    layout/Sidebar.tsx
    layout/TopBar.tsx
    coaching/CoachingForm.tsx
    employees/EmployeeForm.tsx
    admin/AdminRoleManager.tsx
  lib/
    supabase/
      client.ts
      server.ts
      middleware.ts
      types.ts
    email/
      resend.ts
  middleware.ts
```

Also copy config files:
- `next.config.js`
- `tailwind.config.js`
- `tsconfig.json`
- `postcss.config.js`
- `vercel.json`

---

## STEP 7 — Local Development

```bash
npm run dev
```

Open http://localhost:3000

**First-time setup:**
1. Sign in with Google
2. Your account is created with `employee` role by default
3. In Supabase Dashboard → Table Editor → profiles
4. Find your row, change `role` to `admin`
5. Refresh the app — you'll now see the Admin panel

---

## STEP 8 — Deploy to Vercel

### Option A: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Option B: GitHub Integration
1. Push code to GitHub
2. Go to https://vercel.com → New Project
3. Import your GitHub repo
4. Add all environment variables (same as `.env.local` but with production values):
   - `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`
   - All other vars as above
5. Deploy

### After Deploy — Update OAuth Redirect
In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

In Google Cloud Console → Credentials → OAuth Client:
- Add `https://your-project-id.supabase.co/auth/v1/callback` to authorized URIs

---

## STEP 9 — Cron Job Setup (Vercel)

`vercel.json` is already configured to run the reminder cron daily at 9 AM UTC:
```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Vercel will automatically call your endpoint. It uses the `x-vercel-cron` header for Vercel Pro plans.

For **Vercel Hobby** (free), crons are limited. Alternative: Use a free service like:
- https://cron-job.org
- Set it to call: `GET https://your-app.vercel.app/api/cron/reminders`
- Header: `x-cron-secret: your-cron-secret`

---

## STEP 10 — First Admin Setup

After deploying:
1. Sign in with Google at your production URL
2. In Supabase SQL Editor, run:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
   ```
3. You're now an Admin — use the Admin panel to set other users' roles

---

## Role Reference

| Role     | Capabilities |
|----------|-------------|
| Admin    | Full access — all records, all employees, manage roles |
| Manager  | Own employees, create/edit coaching records, view own sessions |
| Employee | View own coaching records only, acknowledge sessions |

---

## Architecture Notes

### Security
- All database queries go through RLS — users can only see their own data
- The service role key is used only server-side (acknowledgment + cron routes)
- Acknowledgment tokens are UUIDs (unguessable, generated by Postgres)
- The cron endpoint is protected by a secret header

### Email Flow
1. Manager submits coaching form → POST /api/coaching
2. Server inserts record → gets token from DB
3. Resend sends HTML email with acknowledge link
4. Employee clicks link → GET /acknowledge/[token]
5. Server marks record as acknowledged

### Reminder Flow
1. Vercel cron triggers GET /api/cron/reminders at 9 AM UTC
2. Queries for pending records older than 3 days with no reminder sent
3. Sends reminder email via Resend
4. Updates `reminder_sent_at` to prevent duplicate reminders

---

## Troubleshooting

**Google login not working:**
- Check redirect URIs in Google Console and Supabase
- Ensure `NEXT_PUBLIC_APP_URL` matches your actual URL

**Emails not sending:**
- Verify your domain in Resend dashboard
- Check `RESEND_API_KEY` and `RESEND_FROM_EMAIL`

**RLS blocking queries:**
- Make sure you ran `rls-policies.sql`
- Check Supabase → Authentication → Users to verify your user exists
- Verify your profile row exists in the `profiles` table

**Employee not seeing records:**
- Ensure the employee's `profile_id` in the `employees` table matches their auth user `id`
- Link them manually in SQL: `UPDATE employees SET profile_id = 'auth-user-uuid' WHERE email = 'emp@company.com'`
