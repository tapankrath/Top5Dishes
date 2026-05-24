/*
 * Fork&Find — Cloudflare Worker proxy
 * --------------------------------------------------
 * This tiny backend holds your Anthropic API key SECRETLY (as a Worker secret),
 * so your public GitHub Pages site can search the web without ever exposing the key.
 *
 * SETUP (about 10 minutes, free tier is plenty):
 *   1. Create a free account at https://dash.cloudflare.com
 *   2. Workers & Pages  ->  Create  ->  Create Worker.  Name it e.g. "forkfind".
 *   3. Click "Edit code", delete the sample, paste THIS file, click Deploy.
 *   4. Go to the Worker's  Settings -> Variables and Secrets -> Add:
 *         Name:  ANTHROPIC_API_KEY      Type: Secret      Value: sk-ant-... (your key)
 *      Save & redeploy.
 *   5. Copy your Worker URL (looks like https://forkfind.<you>.workers.dev).
 *   6. In index.html, set  PROXY_URL  (top of the <script>) to that URL.
 *      Then in askClaude(), point fetch() at PROXY_URL instead of api.anthropic.com.
 *      (See README for the 3-line change.)
 *
 * SECURITY: optionally lock ALLOWED_ORIGIN to your GitHub Pages domain so only
 * your site can use the Worker.
 */

const ALLOWED_ORIGIN = "*"; // e.g. "https://tapankrath.github.io"

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors() });
    }
    if (request.method !== "POST") {
      return json({ error: "POST only" }, 405);
    }

    try {
      const body = await request.json();

      const upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,   // <- the secret, never sent to the browser
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });

      const data = await upstream.text();
      return new Response(data, {
        status: upstream.status,
        headers: { "Content-Type": "application/json", ...cors() },
      });
    } catch (err) {
      return json({ error: "proxy_failed", detail: String(err) }, 500);
    }
  },
};

function cors() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors() },
  });
}
