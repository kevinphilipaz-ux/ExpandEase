# Supabase setup for ExpandEase (Save Work)

Use this to enable the **Save Work** feature so users can create an account and persist their analysis in the cloud.

**Project URL:** `https://qshzhqqxmtwillgthpgm.supabase.co`

---

## 1. Add env vars (local)

In the **project root** (same folder as `package.json`), create a `.env` file (or copy from `.env.example`):

```bash
# Supabase – required for Save Work
VITE_SUPABASE_URL=https://qshzhqqxmtwillgthpgm.supabase.co
VITE_SUPABASE_ANON_KEY=<paste your anon key here>
```

**Get the anon key:**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your **ExpandEase** project.
2. Go to **Project Settings** (gear) → **API**.
3. Under **Project API keys**, copy the **anon public** key (starts with `eyJ...`).
4. Paste it as `VITE_SUPABASE_ANON_KEY` in `.env`.

Restart the dev server after changing `.env` so Vite picks up the new values.

---

## 2. Create the `projects` table

1. In the Supabase Dashboard, open **SQL Editor**.
2. Copy the contents of **`supabase/migrations/001_projects.sql`** (in this repo).
3. Paste into the SQL Editor and click **Run**.

This creates the `projects` table and RLS so each user can only read/write their own project.

---

## 3. Enable auth providers

1. Go to **Authentication** → **Providers**.
2. **Google:** Enable it and add your redirect URL(s), e.g.  
   - `http://localhost:5173` (or your dev port)  
   - `https://yourdomain.com` (production)
3. **Email:** Enable it.  
   - Optional: turn off **“Confirm email”** if you want users to use the app immediately without verifying email.

After this, the Save Work modal will show **Continue with Google** and the email/password form instead of “Save feature is not configured.”

---

## Quick checklist

- [ ] `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Ran `001_projects.sql` in SQL Editor
- [ ] Google provider enabled + redirect URL(s) set
- [ ] Email provider enabled
- [ ] Dev server restarted after editing `.env`
