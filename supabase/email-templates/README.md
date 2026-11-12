# Mail-Vorlagen für Supabase Auth

Reihenfolge der Sprachen: Spanisch, Englisch, Deutsch (Frank, 12.11.2026).
Eintragen in Supabase → Authentication → Emails → Templates (jeweils „Subject“ und „Body“ → Source/HTML).

| Supabase-Vorlage | Datei | Betreff (Subject) |
|---|---|---|
| Reset Password | `reset-password.html` | `Marcha: nueva contraseña · new password · neues Passwort` |
| Magic Link | `magic-link.html` | `Marcha: tu enlace para entrar · sign-in link · Anmelde-Link` |
| Confirm signup | `confirm-signup.html` | `Marcha: confirma tu cuenta · confirm your account · Konto bestätigen` |

Platzhalter von Supabase: `{{ .ConfirmationURL }}` (Knopf-Link), `{{ .Email }}`.
Logo: `https://www.gomarcha.com/assets/icon-192-v5.png` – nicht löschen/umbenennen, sonst fehlt es in den Mails.
