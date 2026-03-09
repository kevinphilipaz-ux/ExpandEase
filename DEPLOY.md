# Deploy ExpandEase to Vercel

Your site will stay online 24/7—no need to keep your laptop open. Set `VITE_GOOGLE_MAPS_API_KEY` in Vercel for address autocomplete.

## 1. Put your code on GitHub

If the project isn’t on GitHub yet:

1. Create a new repo at [github.com/new](https://github.com/new) (e.g. `ExpandEase`, leave it empty—no README).
2. In your project folder, run:

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/ExpandEase.git
   git branch -M main
   git push -u origin main
   ```

   Use your actual GitHub username and repo name. If you already have a `remote`, skip `git remote add` and just `git push`.

## 2. Connect the repo to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (use “Continue with GitHub”).
2. Click **“Add New…”** → **“Project”**.
3. **Import** your `ExpandEase` repository (or the repo that contains this app).
4. **If your app is in a subfolder** (e.g. the repo root is `ExpandEase` but the Vite app is in a child folder), set **Root Directory** to that folder (e.g. `d3885643-99fa-4255-a615-8e1b0b2ac65b`). Otherwise leave it blank.
5. Leave the rest as-is (Vercel detects Vite and uses `npm run build` and `dist`).
6. Click **Deploy**.

## 3. Share the site

When the deploy finishes, Vercel gives you a URL like:

`https://expand-ease-xxxx.vercel.app`

- Use that link on your phone or send it to anyone—it works as long as Vercel is up, not your laptop.
- Every time you `git push` to the connected branch, Vercel will rebuild and update the site.

## Summary

- **Local:** Keep using `npm run dev` and edit code as usual.
- **Public:** Push to GitHub → Vercel deploys automatically → share the Vercel URL. No need to keep your computer on.
