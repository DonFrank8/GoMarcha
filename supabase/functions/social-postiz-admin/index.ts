import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * social-postiz-admin — Entwürfe in Postiz zurückziehen oder erneuern (16.11.2026, Freigabe Frank)
 *
 * Aktionen (Body):
 *   { action: "withdraw", queue_id, reason? }
 *       Löscht alle Postiz-Posts dieses Eintrags (Instagram + Facebook, IDs aus
 *       postiz_response._marcha_postiz_post_ids bzw. postiz_post_id) und setzt den Eintrag auf
 *       „skipped“. Für Doppel- oder Fehlposts.
 *   { action: "refresh", queue_id }
 *       Löscht die Postiz-Posts, öffnet den Eintrag wieder („draft“), lässt den Wochenplaner ihn
 *       neu berechnen (z. B. später freigegebene Events) und gibt ihn danach wieder frei für den
 *       Versender („pending“ → neuer Postiz-Entwurf beim nächsten Runner-Lauf).
 *       Nur für Einträge mit slot_key (Wochenplan).
 *
 *   { action: "story_draft", image_url, date, caption? }
 *       Lädt ein Bild (https, z. B. Canva-Export oder Event-Foto) zu Postiz hoch und legt einen
 *       Instagram-STORY-Entwurf (post_type "story", type "draft") zum Zeitpunkt date an.
 *       Geht erst nach Freigabe in Postiz raus. Für „Hoy en la Costa“.
 *   { action: "story_queue", image_url, date, event_id?, title?, index?, canva_url? }
 *       Legt eine Story als ENTWURF in social_queue an (post_stage "story", slot_key "<Tag>:story:<index>").
 *       Das Bild (z. B. Canva-Export) wird dauerhaft in Storage event-images/stories/ gespeichert.
 *       Frank gibt die Story im Admin frei; danach plant der Versender sie in Postiz ein.
 *       Gibt es für den Platz schon einen offenen Entwurf, wird er ersetzt (neues Bild).
 *   { action: "delete_post", post_id }
 *       Löscht einen einzelnen Postiz-Post ohne Eintrag in social_queue (z. B. einen Story-Entwurf).
 *   { action: "list", from, to }
 *       Nur lesen: Postiz-Posts im Zeitraum (ISO-Daten) mit ID, Datum, Status, Netzwerk und Textanfang.
 *
 * Bereits veröffentlichte Posts (status „posted“) werden nie angefasst.
 * Zugriff: Header x-marcha-social-secret (= MARCHA_SOCIAL_RUNNER_SECRET) oder Admin (app_metadata.role).
 * Secrets: POSTIZ_API_KEY, optional POSTIZ_API_BASE. Standard: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-marcha-social-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), { status, headers: { "Content-Type": "application/json", ...CORS } });
}
function slog(event: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ fn: "social-postiz-admin", event, ...data }));
}

async function isAdminRequest(req: Request, base: string): Promise<boolean> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!token || token.split(".").length !== 3 || !base || !anon) return false;
  const res = await fetch(`${base}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  if (!res.ok) return false;
  const user = await res.json().catch(() => null);
  return user?.app_metadata?.role === "admin";
}

// deno-lint-ignore no-explicit-any
function postizIds(row: any): string[] {
  const list = Array.isArray(row?.postiz_response?._marcha_postiz_post_ids) ? row.postiz_response._marcha_postiz_post_ids : [];
  const ids = [...list, row?.postiz_post_id].map((x) => String(x || "").trim()).filter(Boolean);
  return [...new Set(ids)];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const base = Deno.env.get("SUPABASE_URL") || "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const postizKey = Deno.env.get("POSTIZ_API_KEY") || "";
  const postizBase = (Deno.env.get("POSTIZ_API_BASE") || "https://api.postiz.com/public/v1").replace(/\/$/, "");
  if (!base || !service || !postizKey) return json({ error: "Missing configuration" }, 500);

  const secret = Deno.env.get("MARCHA_SOCIAL_RUNNER_SECRET") || "";
  const hasSecret = Boolean(secret) && (req.headers.get("x-marcha-social-secret") || "") === secret;
  if (!hasSecret && !(await isAdminRequest(req, base))) return json({ error: "Unauthorized" }, 401);

  // deno-lint-ignore no-explicit-any
  const body: any = await req.json().catch(() => ({}));
  const action = String(body?.action || "");
  const queueId = String(body?.queue_id || "");
  if (!["withdraw", "refresh", "list", "story_draft", "delete_post", "story_queue"].includes(action)) return json({ error: "Unknown action" }, 400);
  if (action === "story_draft") {
    const imageUrl = String(body?.image_url || "");
    const date = new Date(String(body?.date || ""));
    const igId = Deno.env.get("POSTIZ_INSTAGRAM_INTEGRATION_ID") || "";
    if (!/^https:\/\//i.test(imageUrl)) return json({ error: "image_url (https) fehlt" }, 400);
    if (Number.isNaN(date.getTime()) || date.getTime() < Date.now()) return json({ error: "date fehlt oder liegt in der Vergangenheit" }, 400);
    if (!igId) return json({ error: "POSTIZ_INSTAGRAM_INTEGRATION_ID fehlt" }, 500);
    // 1) Bild laden und zu Postiz hochladen
    const img = await fetch(imageUrl);
    if (!img.ok) return json({ error: `Bild nicht ladbar (${img.status})` }, 400);
    const type = (img.headers.get("content-type") || "image/jpeg").split(";")[0];
    if (!/^image\/(jpeg|png|webp)$/.test(type)) return json({ error: `Bildformat ${type} nicht unterstützt` }, 400);
    const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
    const form = new FormData();
    form.append("file", new Blob([await img.arrayBuffer()], { type }), `story-${Date.now()}.${ext}`);
    const up = await fetch(`${postizBase}/upload`, { method: "POST", headers: { Authorization: postizKey }, body: form });
    // deno-lint-ignore no-explicit-any
    const media: any = await up.json().catch(() => null);
    if (!up.ok || !media?.id || !media?.path) return json({ error: `Upload fehlgeschlagen (${up.status})`, body: media }, 502);
    // 2) Story-Entwurf anlegen
    const payload = {
      type: "draft",
      date: date.toISOString(),
      shortLink: false,
      tags: [{ value: "", label: "" }],
      posts: [{
        group: crypto.randomUUID(),
        integration: { id: igId },
        value: [{ content: String(body?.caption || ""), image: [{ id: media.id, path: media.path }] }],
        settings: { __type: "instagram", post_type: "story", is_trial_reel: false, collaborators: [] },
      }],
    };
    const res = await fetch(`${postizBase}/posts`, {
      method: "POST",
      headers: { Authorization: postizKey, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const created = await res.json().catch(() => null);
    slog("story_draft", { ok: res.ok, status: res.status, date: date.toISOString(), created });
    return json({ ok: res.ok, status: res.status, created, media_path: media.path }, res.ok ? 200 : 502);
  }
  if (action === "story_queue") {
    const imageUrl = String(body?.image_url || "");
    const date = new Date(String(body?.date || ""));
    if (!/^https:\/\//i.test(imageUrl)) return json({ error: "image_url (https) fehlt" }, 400);
    if (Number.isNaN(date.getTime()) || date.getTime() < Date.now()) return json({ error: "date fehlt oder liegt in der Vergangenheit" }, 400);
    const index = Math.min(Math.max(Number(body?.index) || 1, 1), 5);
    const eventIdRaw = String(body?.event_id ?? "").trim();
    const eventId = /^\d+$/.test(eventIdRaw) ? Number(eventIdRaw) : null;
    const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    const slotKey = `${ymd}:story:${index}`;
    const sh = { apikey: service, Authorization: `Bearer ${service}` };
    // 1) Bild laden und dauerhaft speichern
    const img = await fetch(imageUrl);
    if (!img.ok) return json({ error: `Bild nicht ladbar (${img.status})` }, 400);
    const type = (img.headers.get("content-type") || "image/jpeg").split(";")[0];
    if (!/^image\/(jpeg|png|webp)$/.test(type)) return json({ error: `Bildformat ${type} nicht unterstützt` }, 400);
    const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
    const path = `stories/${ymd}-${index}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const up = await fetch(`${base}/storage/v1/object/event-images/${path}`, {
      method: "POST",
      headers: { ...sh, "Content-Type": type, "x-upsert": "true" },
      body: await img.arrayBuffer(),
    });
    if (!up.ok) return json({ error: `Speichern fehlgeschlagen (${up.status})`, body: (await up.text()).slice(0, 200) }, 502);
    const publicUrl = `${base}/storage/v1/object/public/event-images/${path}`;
    // 2) Eintrag anlegen oder offenen Entwurf ersetzen
    const rest2 = (p: string, init: RequestInit = {}) =>
      fetch(`${base}/rest/v1/${p}`, { ...init, headers: { ...sh, "Content-Type": "application/json", ...(init.headers || {}) } });
    const exRes = await rest2(`social_queue?select=id,status,admin_confirmed_at&slot_key=eq.${encodeURIComponent(slotKey)}&status=neq.skipped`);
    const existing = exRes.ok ? (await exRes.json())?.[0] : null;
    const fields = {
      event_id: eventId,
      platform: "instagram",
      platforms: ["instagram"],
      scheduled_at: date.toISOString(),
      slot_key: slotKey,
      title: String(body?.title || (eventId ? "Story" : "Story Marcha")).slice(0, 200),
      caption: "",
      image_url: publicUrl,
      resolved_image_url: publicUrl,
      post_stage: "story",
      occurrence_date: ymd,
      event_date: ymd,
      postiz_response: { _marcha_story: { canva_url: String(body?.canva_url || "") || null, source_image: imageUrl.split("?")[0] } },
      updated_at: new Date().toISOString(),
    };
    if (existing) {
      if (!["pending", "draft"].includes(String(existing.status)) || existing.admin_confirmed_at) {
        return json({ error: "Für diesen Platz ist schon eine freigegebene Story vorhanden – erst im Admin zurückziehen.", queue_id: existing.id }, 409);
      }
      const res = await rest2(`social_queue?id=eq.${existing.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(fields) });
      slog("story_queue", { action: "replace", queue_id: existing.id, slot_key: slotKey, ok: res.ok });
      return json({ ok: res.ok, action: "replaced", queue_id: existing.id, slot_key: slotKey, image_url: publicUrl }, res.ok ? 200 : 502);
    }
    const res = await rest2("social_queue", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...fields, status: "pending", retry_count: 0 }),
    });
    const created = res.ok ? (await res.json())?.[0] : null;
    slog("story_queue", { action: "insert", queue_id: created?.id, slot_key: slotKey, ok: res.ok });
    return json({ ok: res.ok, action: "created", queue_id: created?.id ?? null, slot_key: slotKey, image_url: publicUrl, detail: res.ok ? undefined : (await res.text()).slice(0, 200) }, res.ok ? 200 : 502);
  }
  if (action === "delete_post") {
    const postId = String(body?.post_id || "").trim();
    if (!/^[a-z0-9]{10,40}$/i.test(postId)) return json({ error: "post_id fehlt" }, 400);
    const res = await fetch(`${postizBase}/posts/${encodeURIComponent(postId)}`, { method: "DELETE", headers: { Authorization: postizKey } });
    const text = (await res.text().catch(() => "")).slice(0, 200);
    slog("postiz_delete_post", { post_id: postId, status: res.status });
    return json({ ok: res.ok, status: res.status, body: text }, res.ok ? 200 : 502);
  }
  if (action === "list") {
    const from = new Date(String(body?.from || "")), to = new Date(String(body?.to || ""));
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return json({ error: "from/to fehlen" }, 400);
    const res = await fetch(
      `${postizBase}/posts?startDate=${encodeURIComponent(from.toISOString())}&endDate=${encodeURIComponent(to.toISOString())}`,
      { headers: { Authorization: postizKey } },
    );
    // deno-lint-ignore no-explicit-any
    const data: any = await res.json().catch(() => null);
    // deno-lint-ignore no-explicit-any
    const posts = (Array.isArray(data?.posts) ? data.posts : []).map((p: any) => ({
      id: p?.id, group: p?.group ?? null, publishDate: p?.publishDate, state: p?.state, status: p?.status ?? null,
      provider: p?.integration?.providerIdentifier, content: String(p?.content || "").replace(/<[^>]+>/g, " ").slice(0, 90),
    }));
    return json({ ok: res.ok, status: res.status, count: posts.length, posts });
  }
  if (!/^[0-9a-f-]{36}$/i.test(queueId)) return json({ error: "queue_id fehlt" }, 400);

  const headers = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" };
  const rest = (path: string, init: RequestInit = {}) =>
    fetch(`${base}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  const patchRow = (patch: Record<string, unknown>) =>
    rest(`social_queue?id=eq.${queueId}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
    });

  const rowRes = await rest(`social_queue?select=*&id=eq.${queueId}`);
  const row = rowRes.ok ? (await rowRes.json())?.[0] : null;
  if (!row) return json({ error: "Eintrag nicht gefunden" }, 404);
  if (String(row.status) === "posted") return json({ error: "Schon veröffentlicht – bitte direkt in Instagram/Facebook bearbeiten." }, 409);
  if (action === "refresh" && !row.slot_key) return json({ error: "Nur Wochenplan-Einträge (slot_key) können erneuert werden." }, 400);

  // 1) Postiz-Posts löschen (404 = schon weg → ok)
  const deletions = [];
  for (const id of postizIds(row)) {
    const res = await fetch(`${postizBase}/posts/${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: postizKey } });
    const text = (await res.text().catch(() => "")).slice(0, 200);
    deletions.push({ id, status: res.status, ok: res.ok || res.status === 404, body: text });
  }
  slog("postiz_delete", { queue_id: queueId, action, deletions });
  if (deletions.some((d) => !d.ok)) {
    return json({ error: "Postiz hat nicht alles gelöscht – Eintrag unverändert.", deletions }, 502);
  }
  const meta = {
    ...(row.postiz_response && typeof row.postiz_response === "object" ? row.postiz_response : {}),
    _marcha_postiz_post_ids: [],
    _marcha_withdrawn: { at: new Date().toISOString(), action, reason: String(body?.reason || "").slice(0, 200), ids: deletions.map((d) => d.id) },
  };

  if (action === "withdraw") {
    const res = await patchRow({ status: "skipped", last_error: `withdrawn:${String(body?.reason || "admin").slice(0, 80)}`, postiz_post_id: null, postiz_response: meta });
    return json({ ok: res.ok, action, queue_id: queueId, deletions });
  }

  // 2) refresh: wieder öffnen (draft = Planer darf ändern, Versender greift noch nicht)
  let res = await patchRow({
    status: "draft", postiz_post_id: null, postiz_synced_at: null, admin_confirmed_at: null,
    retry_count: 0, last_error: null, caption_template_id: null, postiz_response: meta,
  });
  if (!res.ok) return json({ error: `Eintrag konnte nicht geöffnet werden (${res.status})`, deletions }, 500);

  // 3) Wochenplaner neu rechnen lassen
  let planner: unknown = null;
  if (secret) {
    const pRes = await fetch(`${base}/functions/v1/social-week-planner`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-marcha-social-secret": secret, Authorization: `Bearer ${service}` },
      body: "{}",
    });
    const pJson = await pRes.json().catch(() => null);
    // deno-lint-ignore no-explicit-any
    planner = (pJson as any)?.written ?? pRes.status;
  }

  // 4) für den Versender freigeben
  res = await patchRow({ status: "pending" });
  const after = await rest(`social_queue?select=id,status,slot_key,collection_event_ids,caption&id=eq.${queueId}`);
  return json({ ok: res.ok, action, queue_id: queueId, deletions, planner, row: after.ok ? (await after.json())?.[0] : null });
});
