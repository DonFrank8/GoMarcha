import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createTransport } from "npm:nodemailer@6";

/**
 * notify-new-event — Supabase Edge Function
 *
 * Sends an admin notification email via Zoho SMTP whenever a new event is
 * submitted with status = 'pending'.
 *
 * Erweiterung Veranstalter-Konten Etappe C (13.11.2026), gleiche Webhook-Kopfzeilen:
 *   - public.organizers INSERT                     → Mail an Admin („Neuer Veranstalter“)
 *   - public.organizers UPDATE status → verified   → Mail an den Veranstalter
 *   - public.events UPDATE status (mit organizer_id):
 *       → approved  Mail an Veranstalter („Event ist online“)
 *       → rejected  Mail an Veranstalter („nicht veröffentlicht“)
 *       → pending   Mail an Admin („geändertes Event wartet“)
 *   Die E-Mail-Adresse des Veranstalters wird serverseitig über die Auth-Admin-API
 *   gelesen (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, Standard in Edge Functions).
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

/** Generic mail sender (Zoho SMTP). Throws on SMTP failure. */
async function sendMail(to: string, subject: string, text: string, fromName = "Marcha Benachrichtigung"): Promise<void> {
  const host      = Deno.env.get("SMTP_HOST")         || "smtp.zoho.eu";
  const port      = parseInt(Deno.env.get("SMTP_PORT") || "465", 10);
  const user      = Deno.env.get("SMTP_USER")         || "";
  const pass      = Deno.env.get("SMTP_PASS")         || "";

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

  await transport.sendMail({
    from:    `"${fromName}" <${user}>`,
    replyTo: user,
    to,
    subject,
    text,
  });
}

function adminRecipient(): string {
  return Deno.env.get("NOTIFY_RECIPIENT") || "info@gomarcha.com";
}

/** Send the admin notification email for a new pending event. */
async function sendNotification(ev: EventRecord, organizerName: string | null = null): Promise<void> {
  const eventName = str(ev.name, "Unbekanntes Event");
  const subject   = `Neues Event eingereicht: ${eventName}`;
  let body        = buildEmailBody(ev);
  if (organizerName) {
    body = body.replace("Eingereicht:", `Veranstalter: ${organizerName} (Konto)\nEingereicht:`);
  }
  await sendMail(adminRecipient(), subject, body);
}

// ── Veranstalter (Etappe C) ──────────────────────────────────────────────────

const SITE_URL = "https://www.gomarcha.com";

function serviceHeaders(): Record<string, string> | null {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!key) return null;
  return { apikey: key, Authorization: `Bearer ${key}` };
}

/** E-Mail-Adresse eines Kontos über die Auth-Admin-API (nur serverseitig). */
async function getUserEmail(userId: string): Promise<string | null> {
  const base = Deno.env.get("SUPABASE_URL") || "";
  const headers = serviceHeaders();
  if (!base || !headers || !userId) return null;
  const res = await fetch(`${base}/auth/v1/admin/users/${encodeURIComponent(userId)}`, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  return typeof data?.email === "string" ? data.email : null;
}

/** Name des Veranstalters (für Admin-Mails). */
async function getOrganizerName(organizerId: string): Promise<string | null> {
  const base = Deno.env.get("SUPABASE_URL") || "";
  const headers = serviceHeaders();
  if (!base || !headers || !organizerId) return null;
  const res = await fetch(
    `${base}/rest/v1/organizers?id=eq.${encodeURIComponent(organizerId)}&select=name`,
    { headers },
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0]?.name ? String(rows[0].name) : null;
}

const KIND_LABEL: Record<string, string> = {
  location: "Location / Saal", bar: "Bar / Beachclub / Chiringuito",
  band: "Band / Musiker", dj: "DJ", other: "Sonstiges",
};

async function handleOrganizerInsert(rec: Record<string, unknown>): Promise<string> {
  const email = await getUserEmail(str(rec.id, ""));
  const body = [
    "Ein neuer Veranstalter hat sich angemeldet und wartet auf Prüfung.",
    "",
    `Name:          ${str(rec.name)}`,
    `Art:           ${KIND_LABEL[String(rec.kind)] || str(rec.kind)}`,
    `Ansprechpartn.: ${str(rec.contact_person)}`,
    `Telefon:       ${str(rec.phone)}`,
    `Adresse:       ${str(rec.address)}${rec.city ? ", " + str(rec.city) : ""}`,
    `Website:       ${str(rec.website)}`,
    `Instagram:     ${str(rec.instagram)}`,
    `E-Mail:        ${email || "—"}`,
    "",
    `👉 Prüfen und freigeben: ${SITE_URL}/admin.html (Bereich „Veranstalter“)`,
    "",
    "---",
    "Diese E-Mail wurde automatisch von Marcha gesendet.",
  ].join("\n");
  await sendMail(adminRecipient(), `Neuer Veranstalter: ${str(rec.name)}`, body);
  return "organizer_signup_admin_mail";
}

async function handleOrganizerVerified(rec: Record<string, unknown>): Promise<string> {
  const email = await getUserEmail(str(rec.id, ""));
  if (!email) return "organizer_verified_no_email";
  const name = str(rec.name, "");
  const link = `${SITE_URL}/veranstalter.html`;
  const body = [
    `¡Hola${name ? " " + name : ""}!`,
    "",
    "Tu cuenta de organizador en Marcha está verificada. A partir de ahora tus eventos se publican directamente.",
    `Añadir o ver tus eventos: ${link}`,
    "",
    "—",
    "",
    `Hi${name ? " " + name : ""},`,
    "Your organizer account on Marcha is verified. From now on, your events go live straight away.",
    `Add or view your events: ${link}`,
    "",
    "—",
    "",
    `Hallo${name ? " " + name : ""},`,
    "dein Veranstalter-Konto bei Marcha ist freigeschaltet. Deine Events gehen ab jetzt direkt online.",
    `Events eintragen oder ansehen: ${link}`,
    "",
    "Marcha · www.gomarcha.com · info@gomarcha.com",
  ].join("\n");
  await sendMail(email, "Marcha: cuenta verificada / account verified / Konto freigeschaltet", body, "Marcha");
  return "organizer_verified_mail";
}

async function handleEventStatusChange(rec: EventRecord, old: EventRecord | null): Promise<string> {
  const newStatus = String(rec.status ?? "").toLowerCase();
  const oldStatus = String(old?.status ?? "").toLowerCase();
  const organizerId = str(rec.organizer_id, "");
  if (!organizerId || newStatus === oldStatus) return "event_status_unchanged";

  const eventName = str(rec.name, "Event");

  if (newStatus === "pending") {
    // Ungeprüfter Veranstalter hat ein freigegebenes Event geändert → zurück in die Moderation.
    const organizerName = await getOrganizerName(organizerId);
    await sendNotification(rec, organizerName);
    return "event_back_to_pending_admin_mail";
  }

  const email = await getUserEmail(organizerId);
  if (!email) return "event_status_no_email";
  const myEvents = `${SITE_URL}/veranstalter.html`;

  if (newStatus === "approved") {
    const link = `${SITE_URL}/e/${encodeURIComponent(str(rec.id, ""))}`;
    const body = [
      `¡Tu evento «${eventName}» ya está publicado en Marcha!`,
      `Verlo y compartirlo: ${link}`,
      "",
      `Your event “${eventName}” is now live on Marcha.`,
      `View and share it: ${link}`,
      "",
      `Dein Event „${eventName}“ ist jetzt online auf Marcha.`,
      `Ansehen und teilen: ${link}`,
      "",
      `Tus eventos / your events / deine Events: ${myEvents}`,
      "Marcha · www.gomarcha.com · info@gomarcha.com",
    ].join("\n");
    await sendMail(email, `Marcha: «${eventName}» publicado / live / online`, body, "Marcha");
    return "event_approved_mail";
  }

  if (newStatus === "rejected") {
    const body = [
      `Tu evento «${eventName}» no se ha publicado en Marcha.`,
      "Si tienes preguntas, responde a este e-mail.",
      "",
      `Your event “${eventName}” has not been published on Marcha.`,
      "If you have any questions, just reply to this email.",
      "",
      `Dein Event „${eventName}“ wurde nicht auf Marcha veröffentlicht.`,
      "Bei Fragen antworte einfach auf diese E-Mail.",
      "",
      `Tus eventos / your events / deine Events: ${myEvents}`,
      "Marcha · www.gomarcha.com · info@gomarcha.com",
    ].join("\n");
    await sendMail(email, `Marcha: «${eventName}» no publicado / not published / nicht veröffentlicht`, body, "Marcha");
    return "event_rejected_mail";
  }

  return "event_status_other";
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

  // ── 3b. Veranstalter-Fälle (Etappe C) ────────────────────────────────────
  const typeU  = String(type   ?? "").toUpperCase();
  const tableL = String(table  ?? "").toLowerCase();
  const isOrganizerCase =
    String(schema ?? "").toLowerCase() === "public" && record &&
    ((tableL === "organizers" && (typeU === "INSERT" || typeU === "UPDATE")) ||
     (tableL === "events" && typeU === "UPDATE"));
  if (isOrganizerCase) {
    const oldRecord = (payload.old_record || null) as EventRecord | null;
    let outcome = "skipped";
    try {
      if (tableL === "organizers" && typeU === "INSERT") {
        outcome = await handleOrganizerInsert(record as Record<string, unknown>);
      } else if (tableL === "organizers" && typeU === "UPDATE") {
        const becameVerified = String(record.status) === "verified" && String(oldRecord?.status) !== "verified";
        outcome = becameVerified ? await handleOrganizerVerified(record as Record<string, unknown>) : "organizer_update_ignored";
      } else {
        outcome = await handleEventStatusChange(record, oldRecord);
      }
      slog("organizer_case", { table: tableL, type: typeU, id: record.id ?? null, outcome });
    } catch (err) {
      slog("organizer_case_failed", { table: tableL, type: typeU, id: record.id ?? null, error: err instanceof Error ? err.message : String(err) });
    }
    return new Response("OK", { status: 200 });
  }

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
    const organizerName = record.organizer_id ? await getOrganizerName(String(record.organizer_id)) : null;
    await sendNotification(record, organizerName);

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
