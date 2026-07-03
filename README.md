# Generator Operations Management

A professional web system for generator asset operations, inspections, DSE readings, ATS tests, maintenance, reports, and analytics.

## Stack

- Next.js, TypeScript, Tailwind CSS
- Supabase Auth, PostgreSQL, Row Level Security, and Storage
- Recharts analytics
- Role-based access control for Admin, Supervisor, Technician, and Viewer

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Add your Supabase project URL and anon key to `.env.local`.
   Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` locally.

4. Run the SQL files in Supabase:

- `supabase/schema.sql`
- `supabase/seed.sql` if you want clearly marked demo records

5. Start the app:

```bash
npm run dev
```

## Deploy to Vercel

1. Push this folder to a GitHub, GitLab, or Bitbucket repository.
2. In Vercel, import the repository as a Next.js project.
3. Add these environment variables in the Vercel project settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://your-production-domain.vercel.app
```

4. In Supabase, run `supabase/schema.sql`, then optionally `supabase/seed.sql`.
5. In Supabase Auth URL Configuration, set the Site URL to your Vercel production URL and allow these redirect URLs:

```text
https://your-production-domain.vercel.app/auth/callback
https://your-production-domain.vercel.app/**
http://localhost:3000/**
```

For Vercel preview deployments, also add the preview wildcard for your team or account slug:

```text
https://*-your-team-or-account-slug.vercel.app/**
```

6. Deploy from Vercel. The project uses `npm ci` and `npm run build`, as captured in `vercel.json`.

After the first user signs up, promote that account to `admin` from the Supabase SQL editor with the SQL in the Roles section below.

## Roles

- `admin`: Create, edit, delete, approve, and manage everything.
- `supervisor`: Review and approve operational records.
- `technician`: Submit inspections, readings, tests, maintenance, photos, and files.
- `viewer`: View dashboards, reports, and analytics only.

New signups are created as `viewer` by default. Promote the first admin from the Supabase SQL editor:

```sql
update public.users
set role = 'admin'
where email = 'your-admin-email@example.com';
```

## Demo Data

The UI includes demo preview rows when Supabase is not configured or a table is empty. Demo rows are visibly marked and are not presented as real generator data.

## DSE Parsing Extension Point

Future DSE backup/event-log parsing should be implemented in `src/lib/dse-parser.ts`. The current system stores uploaded files and provides a placeholder parser contract so real parsing can be added without changing page flows.
