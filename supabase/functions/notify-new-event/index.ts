import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createTransport } from "npm:nodemailer@6";

/**
 * notify-new-event — Supabase Edge Function
 *
 * Sends an admin notification email via Zoho SMTP whenever a new event is
 * submitted with status = 'pending'.
 *
 * Triggered by a Supabase Database Webhook:
 *   Table:  public.events
 *   Event:  INSERT
 *
 * Required Supabase Secrets:
 *   SMTP_HOST              smtp.zoho.eu
 *   SMTP_PORT              465
 *   SMTP_USER              info@gomarcha.com
 *   SMTP_PASS              <Zoho app password>
 *   NOTIFY_RECIPIENT       info@gomarcha.com  (address to receive alerts)
 *
 * Optional Supabase Secrets:
 *   NOTIFY_WEBHOOK_SECRET  <random string> — must match the secret configured
 *                          in the Supabase Database Webhook "Authorization"
 *                          header for request authenticity verification.
 *                          If not set, webhook auth is skipped (not recommended
 *                          for production).
 *
 * IMPORTANT: This function always returns HTTP 200.
 * Email delivery errors are logged but never propagate to the caller so they
 * cannot block or roll back the event INSERT that triggered the webhook.
 */

// ── Types ────────────────────────────────────────────────────────────────────

interface WebhookPayload {
  type: string;       // "INSERT" | "UPDATE" | "DELETE"
  table: string;      // "events"
  schema: string;     // "public"
  record: EventRecord | null;
  old_record: EventRecord | null;
}

interface EventRecord {
  id?: string | null;
  name?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  location_name?: string | null;
  city?: string | null;
  submitted_by?: string | null;
  status?: string | null;
  [key: string]: unknown;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Safely coerce an unknown value to a trimmed string, or a fallback. */
function str(value: unknown, fallback = "—"): string {
  const s = String(value ?? "").trim();
  return s || fallback;
}

/** Structured log helper — mirrors the pattern used in social-queue-runner. */
function slog(event: string, data?: Record<string, unknown>): void {
  console.log(JSON.stringify({ fn: "notify-new-event", event, ...data }));
}

/** Build the plain-text email body from an event record. */
function buildEmailBody(ev: EventRecord): string {
  const name      = str(ev.name);
  const date      = str(ev.event_date);
  const time      = str(ev.event_time);
  const venue     = str(ev.location_name);
  const city      = str(ev.city);
  const submitter = str(ev.submitted_by);
  const id        = str(ev.id, "");

  const dateTime = [date, time].filter((v) => v !== "—").join(" ") || "—";
  const idLine   = id ? `\nEvent-ID:    ${id}` : "";

  return [
    "Ein neues Event wurde eingereicht und wartet auf Freigabe.",
    "",
    `Name:         ${name}`,
    `Datum:        ${dateTime}`,
    `Ort:          ${venue}, ${city}`,
    `Eingereicht:  ${submitter}`,
    idLine,
    "",
    "👉 Jetzt moderieren: https://gomarcha.com/admin.html",
    "",
    "---",
    "Diese E-Mail wurde automatisch von Marcha gesendet.",
  ]
    .join("\n")
    .trimEnd();
}

/** Send the notification email. Throws on SMTP failure. */
async function sendNotification(ev: EventRecord): Promise<void> {
  const host      = Deno.env.get("SMTP_HOST")         || "smtp.zoho.eu";
  const port      = parseInt(Deno.env.get("SMTP_PORT") || "465", 10);
  const user      = Deno.env.get("SMTP_USER")         || "";
  const pass      = Deno.env.get("SMTP_PASS")         || "";
  const recipient = Deno.env.get("NOTIFY_RECIPIENT")  || "info@gomarcha.com";

  if (!user || !pass) {
    throw new Error("SMTP credentials not configured (SMTP_USER / SMTP_PASS)");
  }

  const transport = createTransport({
    host,
    port,
    secure: port === 465,   // true = SSL on 465, false = STARTTLS on 587
    auth: { user, pass },
    connectionTimeout: 10_000,   // 10 s
    greetingTimeout:   8_000,    // 8 s
    socketTimeout:     15_000,   // 15 s
  });

  const eventName = str(ev.name, "Unbekanntes Event");
  const subject   = `Neues Event eingereicht: ${eventName}`;
  const body      = buildEmailBody(ev);

  await transport.sendMail({
    from:    `"Marcha Benachrichtigung" <${user}>`,
    to:      recipient,
    subject,
    text:    body,
  });
}

// ── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  const startMs = Date.now();

  // ── 1. Only accept POST ───────────────────────────────────────────────────
  if (req.method.toUpperCase() !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // ── 2. Optional webhook secret verification ───────────────────────────────
  // Supabase Database Webhooks send the secret as a custom header.
  // We check x-marcha-webhook-secret first (the header configured in the
  // Supabase Dashboard), then fall back to Authorization: Bearer for
  // compatibility with other callers.
  const webhookSecret = Deno.env.get("NOTIFY_WEBHOOK_SECRET");
  if (webhookSecret) {
    const customHeader = req.headers.get("x-marcha-webhook-secret") || "";
    const authHeader   = req.headers.get("authorization") || "";
    const bearerToken  = authHeader.replace(/^Bearer\s+/i, "").trim();
    const token        = customHeader || bearerToken;
    if (token !== webhookSecret) {
      slog("auth_failed", {
        reason: "invalid_webhook_secret",
        hasCustomHeader: customHeader.length > 0,
        hasAuthHeader:   authHeader.length > 0,
      });
      // Return 200 to avoid Supabase retrying indefinitely on a mis-config.
      return new Response("Unauthorized", { status: 200 });
    }
  }

  // ── 3. Parse webhook payload ──────────────────────────────────────────────
  let payload: WebhookPayload;
  try {
    payload = await req.json() as WebhookPayload;
  } catch (err) {
    slog("parse_error", { error: String(err) });
    return new Response("Bad Request: invalid JSON", { status: 200 });
  }

  const { type, table, schema, record } = payload;

  // ── 4. Guard: only process INSERT on public.events ────────────────────────
  if (
    String(type   ?? "").toUpperCase() !== "INSERT" ||
    String(table  ?? "").toLowerCase() !== "events" ||
    String(schema ?? "").toLowerCase() !== "public"
  ) {
    slog("skipped_wrong_trigger", { type, table, schema });
    return new Response("OK: not an events INSERT", { status: 200 });
  }

  if (!record) {
    slog("skipped_no_record");
    return new Response("OK: no record", { status: 200 });
  }

  // ── 5. Guard: only send for status = 'pending' ───────────────────────────
  //      This is the primary filter — admin inserts with status = 'approved'
  //      will be silently skipped here without sending any email.
  const status = String(record.status ?? "").trim().toLowerCase();
  if (status !== "pending") {
    slog("skipped_not_pending", {
      eventId: record.id ?? null,
      status,
    });
    return new Response("OK: status is not pending", { status: 200 });
  }

  // ── 6. Send notification email ────────────────────────────────────────────
  const eventId   = str(record.id, "unknown");
  const eventName = str(record.name, "Unbekanntes Event");

  slog("sending_notification", {
    eventId,
    eventName,
    status,
    submittedBy: record.submitted_by ?? null,
  });

  try {
    await sendNotification(record);

    const durationMs = Date.now() - startMs;
    slog("notification_sent", {
      eventId,
      eventName,
      durationMs,
    });
  } catch (err) {
    // Email errors are caught and logged but NEVER propagate — the event
    // INSERT must succeed regardless of email delivery issues.
    slog("notification_failed", {
      eventId,
      eventName,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startMs,
    });
  }

  // Always return 200 so the webhook does not retry and does not
  // interfere with the event submission flow.
  return new Response("OK", { status: 200 });
});
