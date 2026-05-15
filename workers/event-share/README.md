# GoMarcha event share Worker

Public crawler-safe share route for event previews:

```text
https://www.gomarcha.com/e/:eventId
```

The Worker renders static HTML with Open Graph/Twitter tags before any
meta-refresh or JavaScript redirect. Normal users land on:

```text
https://www.gomarcha.com/index.html?event_id=:eventId
```

## Required Cloudflare secrets

Use the public anon key if RLS allows public reads for approved events:

```bash
cd workers/event-share
wrangler secret put SUPABASE_ANON_KEY
```

If approved events are not public-readable, use a server-side secret instead:

```bash
cd workers/event-share
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Do not put the service role key in frontend files.

## Deploy

```bash
cd workers/event-share
wrangler deploy
```

The route is configured in `wrangler.toml`:

```text
www.gomarcha.com/e/*
```

## Test

```bash
curl -i -A "facebookexternalhit/1.1" "https://www.gomarcha.com/e/53?v=1"
```

Expected:

- `HTTP/2 200`
- `Content-Type: text/html; charset=utf-8`
- Raw HTML contains `og:title`, `og:description`, `og:image`, and Twitter card tags

Facebook/WhatsApp cache previews. Use a new cache-busting query such as
`?v=2` when retesting:

```text
https://www.gomarcha.com/e/53?v=2
```
