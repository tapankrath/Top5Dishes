# Fork&Find — Setup Guide

A phone web app: find the top 5 restaurants near you, tap one, see its top 5 most-popular dishes pulled from real web reviews.

Files:
- `index.html` — the whole app (open on a phone, "Add to Home Screen")
- `worker.js` — optional backend proxy that hides your API key (for a real public site)

---

## Why your GitHub Pages link wasn't working

The app asks Claude to **search the web**. That requires an Anthropic API key. Inside Claude's preview, the key is supplied automatically — but on your own site (GitHub Pages) there is no key, so every search failed silently.

You have two ways to fix it. Pick one.

---

## Option A — Quick & personal: enter your key in the app (5 min)

Best when it's just you using it.

1. Push `index.html` to your repo (rename to `index.html` at the repo root — GitHub Pages serves that by default).
2. Open the live site on your phone.
3. Tap the **gear ⚙ icon** (top right). Paste your key from
   https://console.anthropic.com/settings/keys → **Save**.
4. Done. The key is stored only in *your* phone's browser (localStorage); it is never written into the public code.

⚠️ Caveat: this works because the browser calls Anthropic directly. Only do this with a key **you** control. Don't ship this to strangers — anyone using your site would need their own key, and a key typed in a browser is only as safe as that device.

---

## Option B — Proper public app: backend proxy (≈10 min, recommended)

Best when others will use it. Your key stays secret on a server; users never see or need one. The gear button isn't needed.

1. Free account at https://dash.cloudflare.com
2. **Workers & Pages → Create → Create Worker**, name it `forkfind`.
3. **Edit code**, paste all of `worker.js`, **Deploy**.
4. **Settings → Variables and Secrets → Add**:
   - Name `ANTHROPIC_API_KEY`, Type **Secret**, Value `sk-ant-...`
   - Save and redeploy.
5. Copy the Worker URL, e.g. `https://forkfind.yourname.workers.dev`.
6. In `index.html`, make this 3-line change near the top of `<script>`:

   ```js
   const PROXY_URL = "https://forkfind.yourname.workers.dev";
   ```

   Then inside `askClaude()` change the fetch target and drop the key headers:

   ```js
   const res = await fetch(PROXY_URL, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1600,
       messages:[{role:"user",content:promptText}],
       tools:[{type:"web_search_20250305",name:"web_search"}] })
   });
   ```
7. (Optional, recommended) In `worker.js` set `ALLOWED_ORIGIN` to your exact Pages URL (e.g. `https://tapankrath.github.io`) so only your site can call it. Redeploy.
8. Push and you're live — no key prompt for anyone.

---

## Deploying to GitHub Pages

1. Put `index.html` at the **root** of your repo (`Top5Dishes`).
2. Repo **Settings → Pages → Source: main branch / root**.
3. Wait ~1 min, your site is at `https://tapankrath.github.io/Top5Dishes/`.

---

## Notes & honest limits

- **Location → restaurant** is the hard part. GPS gives coordinates; matching them to the *exact* place you're standing in is approximate, especially in malls or dense blocks. That's why step 1 lists nearby spots for you to pick — picking is far more reliable than auto-guessing.
- Ratings, prices, and "popular dishes" come from recent web reviews and can be out of date or wrong. The app shows a confidence note and reminds users to confirm the menu in person.
- Web search adds cost per query on your Anthropic account. For a public app, consider adding simple rate limiting in the Worker.
