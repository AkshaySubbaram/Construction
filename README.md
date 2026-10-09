# Construction Manager

A house construction management web app built with Angular and Supabase.

## What it includes
- agency management
- contract tracking
- milestone management
- payment planning and tracking
- daily site progress logging
- expense tracking
- document/photo evidence
- dashboard and reporting
- email-based auth via Supabase

## Local setup
1. Install dependencies:
   npm install
2. Start the app:
   npm start
3. Build for production:
   npm run build

## Supabase setup
1. Open your Supabase project.
2. Go to Authentication > Providers and enable Email.
3. Create a user in Authentication > Users or use your own login.
4. Open SQL Editor and run the schema script in `supabase/schema.sql`.
5. Confirm the app is using your Supabase URL and anon key in `src/environments/environment.ts` and `src/environments/environment.prod.ts`.

## Important note
The app is designed to use live Supabase data when the tables and auth provider are configured. If the schema is missing, the app will fail to fetch agencies, milestones, and related records. The SQL file in `supabase/schema.sql` is the fix for that issue.

## Default login behavior
- If Supabase is configured and a valid session exists, the app uses that live auth session.
- If the environment is not configured, it falls back to a local demo session so UI development still works.
