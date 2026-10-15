# Generator Operations Management

A professional web system for generator asset operations, inspections, DSE readings, ATS tests, maintenance, reports, and analytics.

## Stack

- Next.js, TypeScript, Tailwind CSS
- Supabase Auth, PostgreSQL, Row Level Security, and Storage
- Recharts analytics
- Role-based access control for Admin, Supervisor, Technician, and Viewer

## 3D Assembly Lab prototype

Open **Parts > Explore the 3D Assembly Lab**, or `/parts/assembly`. The browser loads the Three.js viewer only on this page. It uses local, authored geometry and lighting; no remote model/font service is required.

- Click a component to move the orbit pivot to it without changing zoom. Drag to orbit, scroll or pinch to zoom, or use the visible + / - buttons. A short right-click returns the pivot to the full assembly; right-drag, Ctrl-drag, or holding both mouse buttons pans.
- Select components in the model or searchable list; isolate one to inspect and rotate it independently. Returning restores its design placement.
- Use the separation slider or Assemble / Explode buttons without losing the current close-up or zoom. Show internal components, illustrative dimensions, or selectable connection paths.
- Explore the assembly story, installation/operation planning, component inspection notes and source scopes.

The initial package is a representative four-cylinder diesel training assembly, **not an accurate replica of an installed asset**. Geometry, nominal dimensions, typical materials and routing are labeled illustrative. OEM part numbers, mass, exact tools, torques and replacement procedures remain unverified. Catalog photos are reference images, not matches to the authored geometry. The model is separate from the operational asset register.

`src/lib/assembly/training-generator.ts` contains the typed equipment package: component IDs, hierarchy, placement, nominal size, separation vectors, inspection metadata, connection endpoints, stages and sources. Rendering and inspector components are in `src/components/assembly/`. New verified equipment should have its own versioned package; do not overwrite this training definition with unverified asset claims. Detailed imported CAD/GLB ingestion is not implemented in this prototype.

Validate with `npm run build` and `npm run lint`. The real-browser check is `node scripts/check-assembly-viewer.cjs` against a running server (default `http://localhost:3002`); set `ASSEMBLY_TEST_URL`, `PLAYWRIGHT_MODULE` and `CHROME_PATH` for the local environment. It checks orbit, zoom buttons, mouse wheel, touch pinch, isolation/reset, connections, walkthroughs, filtering and mobile overflow. An authenticated deployment needs an authenticated test context, or a separate demo preview with empty Supabase settings. Do not alter production authentication for testing.

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
