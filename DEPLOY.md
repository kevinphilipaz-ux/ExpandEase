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

## 4. Use your custom domain (expandeasenow.com)

To serve the site at **https://expandeasenow.com**:

### A. Add the domain in Vercel

1. In the Vercel dashboard, open your **ExpandEase** project.
2. Go to **Settings** → **Domains**.
3. Click **Add** and enter `expandeasenow.com`.
4. Add `www.expandeasenow.com` as well if you want both to work (Vercel will suggest it).
5. Vercel will show you the DNS records to add (usually **A** and/or **CNAME**).

### B. Point your domain at Vercel (at your registrar)

Where you bought expandeasenow.com (e.g. Namecheap, GoDaddy, Cloudflare, Google Domains), add the DNS records **shown on your Vercel project’s Settings → Domains** page (they can be project-specific). Typically:

- **www (www.expandeasenow.com):** Add a **CNAME** record:  
  - Name: `www`  
  - Value: the target Vercel shows (e.g. `4e72d5ea19e03288.vercel-dns-017.com` or `cname.vercel-dns.com`). Copy the value from the Domains page; some registrars want the trailing dot removed.
- **Root domain (expandeasenow.com):** Vercel may list an **A** record (e.g. `76.76.21.21`) or use **Vercel DNS**; follow the apex-domain instructions on the same Domains page.

Save the DNS changes. Propagation can take from a few minutes up to 48 hours. Then click **Refresh** next to the domain in Vercel to re-verify.

### C. SSL and redirects

- Vercel will issue a free SSL certificate for expandeasenow.com (HTTPS).
- In **Settings** → **Domains**, you can set the **primary** domain (e.g. expandeasenow.com) and optionally redirect `www` → root or root → `www`.

### D. Google Maps / Places API (if you use it)

In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** → your API key → **Application restrictions** → **HTTP referrers**, add:

- `https://expandeasenow.com/*`
- `https://www.expandeasenow.com/*`

(Keep `http://localhost:*` for local development.)

## Summary

- **Local:** Keep using `npm run dev` and edit code as usual.
- **Public:** Push to GitHub → Vercel deploys automatically → share the Vercel URL (or **https://expandeasenow.com** once the custom domain is set). No need to keep your computer on.
