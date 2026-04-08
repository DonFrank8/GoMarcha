# PartyRadar

Platform for discovering local bands, live music events, DJs and venues.

## Admin protection (important)

The moderation area is protected in two layers:

1. **UI/Auth layer (implemented in `app.js`)**
   - Admin mode is still opened with `?admin=1`
   - But moderation actions are only enabled for authenticated admin users
   - Login uses Supabase magic-link (email OTP)
   - Only allowlisted admin emails can moderate

2. **Database layer (required, recommended)**
   - Apply Row Level Security (RLS) policies so non-admin users cannot approve/reject events
   - Run `supabase-rls.sql` in your Supabase SQL editor

### Configure allowlisted admin emails

In `app.js`, adjust:

```js
const ADMIN_ALLOWED_EMAILS = [
  "you@yourdomain.com"
];
```

Use real admin mailboxes only.

### Apply RLS in Supabase

1. Open Supabase project SQL editor
2. Paste and run `supabase-rls.sql`
3. Ensure your admin users exist in `auth.users` with one of the allowlisted emails

After this, moderation is protected both in frontend and backend.
