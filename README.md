# PartyRadar

Platform for discovering local bands, live music events, DJs and venues.

## Admin protection (important)

The moderation area is protected in two layers:

1. **UI/Auth layer (implemented in `app.js`)**
   - Admin mode is still opened with `?admin=1`
   - But moderation actions are only enabled for authenticated admin users
   - Login uses Supabase magic-link (email OTP)
   - Admin access now checks `app_metadata.role === 'admin'` in the Supabase session

2. **Database layer (required, recommended)**
   - Apply Row Level Security (RLS) policies so non-admin users cannot approve/reject events
   - Run `supabase-rls.sql` in your Supabase SQL editor
   - RLS also checks JWT role claim (`auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`)

### Configure admin role in Supabase

Set app metadata on users who should moderate:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email in ('admin@yourdomain.com');
```

After updating metadata, users should re-login so the JWT contains the role claim.

## Geocoding provider config

Event submission can geocode addresses automatically before storing events.

Default setup:
- provider: `nominatim`
- retries: `2`
- minimum interval between requests: `850ms`

Optional runtime config (set in `index.html` before loading `app.js`):

```html
<script>
  window.PARTYRADAR_GEOCODING_PROVIDER = "mapbox"; // "nominatim" | "mapbox"
  window.PARTYRADAR_MAPBOX_TOKEN = "YOUR_MAPBOX_PUBLIC_TOKEN";
</script>
```

If `mapbox` is selected but no token is configured, geocoding falls back gracefully (events are still stored as pending).

## Admin Dashboard

A separate moderation dashboard is now available at:

- `admin.html`

### What it includes

- status tabs (`pending`, `approved`, `rejected`)
- search + filters (event name, city, genre, status)
- modern moderation cards with full event details
- actions:
  - `Approve`
  - `Reject`
  - `Back to pending`
  - save `verification_notes`
- monetization preparation:
  - `featured` toggle
  - `promoted` toggle

### Access control

- dashboard requires an authenticated session
- role-based moderation is enforced (`app_metadata.role = 'admin'`)
- optional frontend email allowlist via `ADMIN_ALLOWED_EMAILS` in `admin.js` for an extra UI gate

### Schema compatibility

- if `featured` / `promoted` columns do not exist yet, the dashboard shows a schema hint and keeps working
- run `supabase-rls.sql` to bootstrap required moderation columns and policies

### Apply RLS in Supabase

1. Open Supabase project SQL editor
2. Paste and run `supabase-rls.sql`
3. Ensure moderator users have `app_metadata.role = 'admin'`
4. If your table is older and missing columns like `status`, run the same script: it now bootstraps required columns before creating policies

### If event submit fails with RLS

If you see `new row violates row-level security policy for table "events"`:

- make sure the **insert policy** exists exactly as in `supabase-rls.sql`
- then re-run the SQL script to refresh policies
- in PartyRadar, event submit inserts as `status = 'pending'` and does not require reading back the inserted row
- if your DB has stricter ownership rules, also run the script section that explicitly allows `anon/authenticated` inserts with `status = 'pending'`

### Optional: Edge Function moderation endpoint

For even stronger isolation, add an Edge Function that performs moderation server-side:
- verify JWT server-side
- check `app_metadata.role === 'admin'`
- update only `status` and `verification_notes`

You can then route moderation updates through that endpoint instead of direct table updates from the browser.
