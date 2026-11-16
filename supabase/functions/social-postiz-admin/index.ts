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
  if (!["withdraw", "refresh", "list"].includes(action)) return json({ error: "Unknown action" }, 400);
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
