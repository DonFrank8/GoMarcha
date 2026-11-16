/*
 * Marcha Admin – „Social → Diese Woche“ (16.11.2026, Rat + Freigabe Frank)
 *
 * Eigene Datei, damit admin.js nicht weiter wächst. Zeigt oben im Bereich „Social“ alle Posts
 * und Stories des Wochenplans (diese + nächste Woche) mit Freigabe an EINEM Ort:
 *   ✅ Freigeben     → Eintrag „ready_for_postiz“ + Versender plant ihn in Postiz fest ein
 *                      (kein zweiter Klick in Postiz)
 *   ✏️ Text ändern   → Text speichern (caption_template_id „manual“, KI überschreibt nicht mehr)
 *   🔄 Neu berechnen → Wochenplaner neu rechnen lassen (bzw. Postiz-Entwurf erneuern)
 *   ↩︎ Zurückziehen  → aus Postiz löschen, Eintrag „skipped“
 *   🛑 Not-Aus       → social_planner_settings.paused (Planer + Versender stoppen)
 * Darunter: Events, die diese/nächste Woche in keinem Post stehen (nur Story/Website).
 * Rechte: nur angemeldete Admins (RLS + Admin-Prüfung in den Edge Functions). Kein Secret im Browser.
 */
(function () {
  "use strict";

  const SUPABASE_URL = "https://dwyhpirtbjfmohcnhdak.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable__H_WNdy1NIfoQbQfyNILKQ_Qb8wQfgn";
  const TZ = "Europe/Madrid";
  const SLOT_LABEL = {
    mon_collection: "Sammelpost „La semana en la Costa“",
    wed_highlight: "Highlight (Mittwoch)",
    thu_collection: "Sammelpost „Planes de finde“",
    sat_highlight: "Highlight (Samstag)",
    story: "Story „Hoy en la Costa“"
  };

  let client = null;
  let busy = false;
  let loadedOnce = false;

  function getClient() {
    if (!client) client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return client;
  }
  const $ = (id) => document.getElementById(id);

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v === null || v === undefined || v === false) return;
      if (k === "text") node.textContent = v;
      else if (k === "class") node.className = v;
      else node.setAttribute(k, v);
    });
    (children || []).forEach((c) => c && node.append(c));
    return node;
  }

  function injectStyles() {
    if ($("adminSocialWeekStyles")) return;
    const style = el("style", { id: "adminSocialWeekStyles" });
    style.textContent = `
      .sw-head { display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between; }
      .sw-kill { display:flex; gap:8px; align-items:center; font-weight:700; }
      .sw-kill.is-on { color:#ff8a8a; }
      .sw-day { margin:14px 0 6px; font-weight:800; opacity:.85; }
      .sw-card { display:grid; grid-template-columns:96px 1fr; gap:12px; padding:12px; border-radius:14px;
        border:1px solid rgba(148,163,184,.25); background:rgba(15,23,42,.45); margin-bottom:10px; }
      .sw-card img { width:96px; height:120px; object-fit:cover; border-radius:10px; background:#111; }
      .sw-card__title { font-weight:800; margin:0 0 2px; }
      .sw-card__meta { font-size:.85rem; opacity:.8; margin:0 0 6px; }
      .sw-card__events { font-size:.85rem; margin:0 0 6px; }
      .sw-status { display:inline-block; font-size:.78rem; font-weight:800; padding:2px 8px; border-radius:999px; margin-bottom:6px;
        border:1px solid rgba(148,163,184,.35); }
      .sw-status--wait { border-color:rgba(255,191,103,.6); color:#ffe6b8; }
      .sw-status--ok { border-color:rgba(67,216,163,.55); color:#d8fff0; }
      .sw-status--err { border-color:rgba(255,122,143,.66); color:#ffdce2; }
      .sw-actions { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
      .sw-actions button, .sw-actions a { font-size:.85rem; }
      .sw-card details { font-size:.85rem; }
      .sw-card textarea { width:100%; min-height:140px; box-sizing:border-box; font:inherit; font-size:14px; border-radius:10px; padding:8px; }
      .sw-uncovered { margin-top:12px; font-size:.9rem; }
      @media (max-width:560px){ .sw-card { grid-template-columns:72px 1fr; } .sw-card img { width:72px; height:90px; } }
    `;
    document.head.append(style);
  }

  function ensureContainer() {
    const view = $("adminViewSocial");
    if (!view) return null;
    let box = $("adminSocialWeek");
    if (box) return box;
    injectStyles();
    box = el("div", { id: "adminSocialWeek", class: "card card--glass" });
    box.innerHTML = `
      <div class="sw-head">
        <div>
          <h2 class="admin-view__h">📅 Diese Woche</h2>
          <p class="card__intro">Alle Posts und Stories dieser und nächster Woche. Nur was du hier freigibst, geht raus – Postiz musst du nicht mehr öffnen.</p>
        </div>
        <label class="sw-kill" id="adminSocialWeekKillLabel"><input type="checkbox" id="adminSocialWeekKill"> 🛑 Not-Aus</label>
      </div>
      <p id="adminSocialWeekFeedback" class="feedback" role="status" hidden></p>
      <div id="adminSocialWeekList"><p class="card__intro">Lade …</p></div>
      <div id="adminSocialWeekUncovered" class="sw-uncovered"></div>`;
    view.prepend(box);
    $("adminSocialWeekKill").addEventListener("change", (e) => setKill(e.target.checked));
    return box;
  }

  function feedback(text, kind) {
    const f = $("adminSocialWeekFeedback");
    if (!f) return;
    f.hidden = !text;
    f.textContent = text || "";
    f.className = `feedback${kind ? ` is-${kind}` : ""}`;
  }

  async function token() {
    const { data } = await getClient().auth.getSession();
    return data?.session?.access_token || "";
  }

  async function callFn(name, body) {
    const t = await token();
    if (!t) throw new Error("Nicht angemeldet.");
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || json?.message || `HTTP ${res.status}`);
    return json;
  }

  // ── Datum ───────────────────────────────────────────────────────────────────
  function madridYmd(date) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }
  function mondayYmd() {
    const today = madridYmd(new Date());
    const d = new Date(`${today}T12:00:00Z`);
    const wd = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() + (wd === 0 ? -6 : 1 - wd));
    return d.toISOString().slice(0, 10);
  }
  function dayLabel(iso) {
    return new Intl.DateTimeFormat("de-DE", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));
  }
  function timeLabel(iso) {
    return new Intl.DateTimeFormat("de-DE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  }

  // ── Status ──────────────────────────────────────────────────────────────────
  function statusOf(row) {
    const s = String(row.status || "");
    const mode = row.postiz_response?._marcha_postiz_mode;
    if (s === "pending" || s === "draft") return { text: "⏳ wartet auf deine Freigabe", cls: "wait", canApprove: true, canEdit: true };
    if (s === "ready_for_postiz" || s === "processing") return { text: "🚀 freigegeben – wird eingeplant", cls: "ok" };
    if (s === "sent_to_postiz" && mode === "schedule") return { text: "✅ freigegeben – in Postiz eingeplant", cls: "ok" };
    if (s === "sent_to_postiz") return { text: "📝 noch Entwurf in Postiz – hier freigeben", cls: "wait", canApprove: Boolean(row.slot_key) && !String(row.slot_key).includes(":story") };
    if (s === "posted") return { text: "✔️ veröffentlicht", cls: "ok" };
    if (s === "failed") return { text: `⚠️ Fehler: ${String(row.last_error || "").slice(0, 80)}`, cls: "err", canApprove: Boolean(row.admin_confirmed_at) };
    return { text: s, cls: "" };
  }

  function slotKind(row) {
    const key = String(row.slot_key || "");
    if (row.post_stage === "story" || key.includes(":story")) return "story";
    return key.split(":")[1] || "";
  }

  function memberIds(row) {
    const ids = Array.isArray(row.collection_event_ids) ? row.collection_event_ids : [];
    return ids.map((x) => String(x).split("::")[0]);
  }

  // ── Laden ───────────────────────────────────────────────────────────────────
  async function load() {
    if (busy) return;
    const box = ensureContainer();
    if (!box) return;
    busy = true;
    try {
      const { data: s } = await getClient().auth.getSession();
      if (s?.session?.user?.app_metadata?.role !== "admin") {
        $("adminSocialWeekList").innerHTML = `<p class="card__intro">Nur für Admins.</p>`;
        return;
      }
      const monday = mondayYmd();
      const from = new Date(`${monday}T00:00:00Z`);
      from.setUTCDate(from.getUTCDate() - 1);
      const to = new Date(`${monday}T00:00:00Z`);
      to.setUTCDate(to.getUTCDate() + 15);

      const [settingsRes, rowsRes] = await Promise.all([
        getClient().from("social_planner_settings").select("paused,require_approval").eq("id", 1).maybeSingle(),
        getClient()
          .from("social_queue")
          .select("id,slot_key,status,post_stage,event_id,collection_event_ids,scheduled_at,title,caption,hashtags,image_url,resolved_image_url,caption_template_id,admin_confirmed_at,last_error,postiz_response")
          .not("slot_key", "is", null)
          .neq("status", "skipped")
          .gte("scheduled_at", from.toISOString())
          .lt("scheduled_at", to.toISOString())
          .order("scheduled_at", { ascending: true })
      ]);
      if (rowsRes.error) throw rowsRes.error;
      const paused = settingsRes.data?.paused === true;
      $("adminSocialWeekKill").checked = paused;
      $("adminSocialWeekKillLabel").classList.toggle("is-on", paused);

      const rows = (rowsRes.data || []).filter((r) => Date.parse(r.scheduled_at) > Date.now() - 6 * 3600 * 1000);
      const ids = new Set();
      rows.forEach((r) => { if (r.event_id) ids.add(String(r.event_id)); memberIds(r).forEach((m) => ids.add(m)); });
      let names = {};
      if (ids.size) {
        const { data: evs } = await getClient().from("events").select("id,name,event_time").in("id", [...ids].filter((x) => /^\d+$/.test(x)).map(Number));
        (evs || []).forEach((e) => { names[String(e.id)] = e.name; });
      }
      render(rows, names, paused);
      loadedOnce = true;
      void loadUncovered();
    } catch (err) {
      feedback(`Konnte „Diese Woche“ nicht laden: ${err?.message || err}`, "error");
    } finally {
      busy = false;
    }
  }

  async function loadUncovered() {
    const target = $("adminSocialWeekUncovered");
    if (!target) return;
    try {
      const plan = await callFn("social-week-planner", { dry_run: true });
      const list = Array.isArray(plan.story_only) ? plan.story_only : [];
      target.innerHTML = "";
      if (!list.length) {
        target.append(el("p", { class: "card__intro", text: "✅ Alle Events dieser und nächster Woche stehen in einem Post." }));
        return;
      }
      target.append(el("p", { class: "card__intro", text: "Nur Story / Website (in keinem Feed-Post):" }));
      const ul = el("ul");
      list.forEach((o) => {
        const d = new Intl.DateTimeFormat("de-DE", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(new Date(`${o.date}T12:00:00Z`));
        ul.append(el("li", { text: `${d}${o.time ? `, ${o.time}` : ""} – ${o.name}` }));
      });
      target.append(ul);
    } catch (err) {
      target.textContent = "";
    }
  }

  // ── Anzeige ─────────────────────────────────────────────────────────────────
  function render(rows, names, paused) {
    const list = $("adminSocialWeekList");
    list.innerHTML = "";
    if (paused) {
      list.append(el("p", { class: "feedback is-error", text: "🛑 Not-Aus ist an: Es wird nichts geplant und nichts verschickt." }));
    }
    if (!rows.length) {
      list.append(el("p", { class: "card__intro", text: "Für diese und nächste Woche sind noch keine Posts geplant." }));
      return;
    }
    let lastDay = "";
    rows.forEach((row) => {
      const day = dayLabel(row.scheduled_at);
      if (day !== lastDay) {
        list.append(el("div", { class: "sw-day", text: day }));
        lastDay = day;
      }
      list.append(renderCard(row, names));
    });
  }

  function renderCard(row, names) {
    const kind = slotKind(row);
    const st = statusOf(row);
    const img = String(row.image_url || row.resolved_image_url || "").trim();
    const eventNames = [row.event_id ? names[String(row.event_id)] : null, ...memberIds(row).map((id) => names[id])]
      .filter(Boolean);
    const body = el("div", {}, [
      el("p", { class: "sw-card__title", text: `${timeLabel(row.scheduled_at)} · ${SLOT_LABEL[kind] || row.title || "Post"}` }),
      el("span", { class: `sw-status sw-status--${st.cls}`, text: st.text }),
      eventNames.length
        ? el("p", { class: "sw-card__events", text: `${eventNames.length === 1 ? "Event" : `${eventNames.length} Events`}: ${eventNames.join(" · ")}` })
        : el("p", { class: "sw-card__events", text: kind === "story" ? "Story über Marcha (kein Event)" : "" })
    ]);
    if (kind !== "story" && row.caption) {
      const det = el("details", {}, [el("summary", { text: "Text ansehen" })]);
      det.append(el("pre", { style: "white-space:pre-wrap;font:inherit;margin:6px 0", text: `${row.caption}${row.hashtags ? `\n\n${row.hashtags}` : ""}` }));
      body.append(det);
    }
    const actions = el("div", { class: "sw-actions" });
    const btn = (label, cls, fn) => {
      const b = el("button", { type: "button", class: `btn-pill ${cls}`, text: label });
      b.addEventListener("click", () => run(b, fn));
      actions.append(b);
    };
    if (st.canApprove) btn("✅ Freigeben", "btn-pill--hero", () => approve(row));
    if (st.canEdit && kind !== "story") btn("✏️ Text ändern", "btn-pill--soft", () => editText(row, body));
    const canva = row.postiz_response?._marcha_story?.canva_url;
    if (canva) actions.append(el("a", { class: "btn-pill btn-pill--soft", href: canva, target: "_blank", rel: "noopener", text: "🎨 In Canva ansehen" }));
    if (kind !== "story" && ["pending", "draft", "sent_to_postiz"].includes(row.status)) {
      btn("🔄 Neu berechnen", "btn-pill--soft", () => recompute(row));
    }
    if (row.status !== "posted") btn("↩︎ Zurückziehen", "btn-pill--soft btn-pill--danger", () => withdraw(row));
    body.append(actions);
    const thumb = img ? el("img", { src: img, alt: "", loading: "lazy" }) : el("div");
    return el("div", { class: "sw-card", "data-queue-id": row.id }, [thumb, body]);
  }

  // ── Aktionen ────────────────────────────────────────────────────────────────
  async function run(button, fn) {
    if (button.disabled) return;
    button.disabled = true;
    feedback("");
    try {
      const msg = await fn();
      if (msg) feedback(msg, "success");
      await load();
    } catch (err) {
      feedback(String(err?.message || err), "error");
    } finally {
      button.disabled = false;
    }
  }

  async function approve(row) {
    const label = slotKind(row) === "story" ? "Story" : "Post";
    if (!window.confirm(`${label} für ${dayLabel(row.scheduled_at)}, ${timeLabel(row.scheduled_at)} freigeben?\nEr wird dann in Postiz fest eingeplant und erscheint automatisch.`)) return "";
    if (row.status === "sent_to_postiz") {
      // Alter Weg: Postiz-Entwurf löschen, Eintrag mit aktuellen Events neu berechnen, dann fest einplanen.
      await callFn("social-postiz-admin", { action: "refresh", queue_id: row.id });
    }
    const { error } = await getClient()
      .from("social_queue")
      .update({ status: "ready_for_postiz", admin_confirmed_at: new Date().toISOString(), last_error: null })
      .eq("id", row.id)
      .in("status", ["pending", "draft", "failed"]);
    if (error) throw error;
    const res = await callFn("social-queue-runner", { queue_id: row.id, admin_handoff: true, limit: 1 });
    const r = Array.isArray(res.results) ? res.results[0] : null;
    if (res.paused) return "Freigegeben – aber der Not-Aus ist an, deshalb wird erst nach dem Ausschalten eingeplant.";
    if (r?.ok) return `✅ Freigegeben und in Postiz für ${timeLabel(row.scheduled_at)} Uhr eingeplant.`;
    if (r?.skipped || r?.error || r?.reason) throw new Error(`Freigegeben, aber Postiz-Übergabe hat nicht geklappt: ${r.reason || r.error || "unbekannt"}`);
    return "Freigegeben – wird beim nächsten Lauf eingeplant.";
  }

  function editText(row, body) {
    if (body.querySelector("textarea")) return "";
    const ta = el("textarea");
    ta.value = String(row.caption || "");
    const save = el("button", { type: "button", class: "btn-pill btn-pill--hero", text: "💾 Text speichern" });
    save.addEventListener("click", () =>
      run(save, async () => {
        const caption = ta.value.trim();
        if (caption.length < 8) throw new Error("Text ist zu kurz.");
        const { error } = await getClient()
          .from("social_queue")
          .update({ caption, caption_template_id: "manual" })
          .eq("id", row.id)
          .in("status", ["pending", "draft"]);
        if (error) throw error;
        return "Text gespeichert. Der Planer ändert diesen Post jetzt nicht mehr automatisch.";
      })
    );
    body.append(ta, save);
    return "";
  }

  async function recompute(row) {
    if (row.status === "sent_to_postiz") {
      if (!window.confirm("Postiz-Entwurf löschen und mit den aktuellen Events neu anlegen?")) return "";
      await callFn("social-postiz-admin", { action: "refresh", queue_id: row.id });
      return "Neu berechnet. Der Post wartet jetzt auf deine Freigabe.";
    }
    const res = await callFn("social-week-planner", {});
    if (res.dry_run) return "Planer ist im Testmodus – nichts geändert.";
    const n = (res.written || []).filter((w) => w.ok).length;
    return n ? `Neu berechnet (${n} Änderung${n === 1 ? "" : "en"}).` : "Neu berechnet – keine Änderung nötig.";
  }

  async function withdraw(row) {
    if (!window.confirm("Diesen Post zurückziehen? Er wird in Postiz gelöscht und nicht veröffentlicht.")) return "";
    await callFn("social-postiz-admin", { action: "withdraw", queue_id: row.id, reason: "Admin: Diese Woche" });
    return "Zurückgezogen.";
  }

  async function setKill(on) {
    const box = $("adminSocialWeekKill");
    if (on && !window.confirm("Not-Aus einschalten? Dann wird nichts mehr geplant und nichts an Postiz geschickt.")) {
      box.checked = false;
      return;
    }
    try {
      const { data: s } = await getClient().auth.getSession();
      const { error } = await getClient()
        .from("social_planner_settings")
        .update({ paused: on, updated_at: new Date().toISOString(), updated_by: s?.session?.user?.email || "admin" })
        .eq("id", 1);
      if (error) throw error;
      feedback(on ? "🛑 Not-Aus ist AN." : "Not-Aus ist aus – Planer und Versender laufen wieder.", on ? "error" : "success");
      await load();
    } catch (err) {
      box.checked = !on;
      feedback(`Not-Aus konnte nicht gesetzt werden: ${err?.message || err}`, "error");
    }
  }

  window.addEventListener("marcha-admin-nav", (ev) => {
    if (ev.detail?.section === "social") void load();
  });
  // Falls der Bereich „Social“ beim Laden schon offen ist
  setTimeout(() => {
    const view = $("adminViewSocial");
    if (view && !view.hidden && !loadedOnce) void load();
  }, 1500);
})();
