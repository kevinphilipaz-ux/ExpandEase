# ExpandEase

## Getting Started

1. Run `npm install`
2. Run `npm run dev`

## Deploying to Vercel (env vars & redeploy)

Environment variables (e.g. `VITE_VENICE_API_KEY`) are **baked into the client bundle at build time**. If you add or change them in **Project → Settings → Environment Variables**, you **must trigger a new deployment** for the change to take effect:

1. Open your project on [vercel.com](https://vercel.com) → **Deployments**.
2. Find the latest **Production** deployment.
3. Click the **⋯** menu on that deployment → **Redeploy**.
4. Leave **Use existing Build Cache** unchecked so the build runs with the new env (recommended).
5. After the new deployment is **Ready**, hard-refresh the live site (Cmd+Shift+R / Ctrl+Shift+R) or open it in an incognito window.

The orange warning next to `VITE_*` variables in Vercel means the value will be included in the client bundle (expected for the Aria chat).
