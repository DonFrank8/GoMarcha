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

### Apply RLS in Supabase

1. Open Supabase project SQL editor
2. Paste and run `supabase-rls.sql`
3. Ensure moderator users have `app_metadata.role = 'admin'`

### Optional: Edge Function moderation endpoint

For even stronger isolation, add an Edge Function that performs moderation server-side:
- verify JWT server-side
- check `app_metadata.role === 'admin'`
- update only `status` and `verification_notes`

You can then route moderation updates through that endpoint instead of direct table updates from the browser.
