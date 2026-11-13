/*
 * Marcha Admin – Bereich „Veranstalter“ (Etappe C, 13.11.2026)
 *
 * Eigene Datei, damit admin.js nicht weiter wächst. admin.js meldet Seitenwechsel
 * über das Ereignis „marcha-admin-nav“. Daten kommen nur über die Admin-Funktionen
 * marcha_admin_list_organizers() und marcha_admin_set_organizer() (prüfen Admin-Rolle
 * in der Datenbank). Kein Service-Role-Key im Browser.
 */
(function () {
  "use strict";

  const SUPABASE_URL = "https://dwyhpirtbjfmohcnhdak.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable__H_WNdy1NIfoQbQfyNILKQ_Qb8wQfgn";
  const KIND = { location: "Location / Saal", bar: "Bar / Beachclub / Chiringuito", band: "Band / Musiker", dj: "DJ", other: "Sonstiges" };
  const STATUS = { pending: "In Prüfung", verified: "Freigegeben", blocked: "Gesperrt" };

  let client = null;
  let loading = false;

  function getClient() {
    if (!client) client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return client;
  }
  const $ = (id) => document.getElementById(id);

  function feedback(text, kind) {
    const el = $("adminOrganizersFeedback");
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.className = `feedback${kind ? ` is-${kind}` : ""}`;
  }

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

  function safeUrl(value) {
    const v = String(value || "").trim();
    return /^https?:\/\//i.test(v) ? v : null;
  }

  function formatDate(value) {
    if (!value) return "–";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "–" : d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function setBadge(rows) {
    const badge = $("adminOrganizersBadge");
    if (!badge) return;
    const pending = rows.filter((r) => r.status === "pending").length;
    badge.hidden = pending === 0;
    badge.textContent = String(pending);
  }

  async function isAdmin() {
    const { data } = await getClient().auth.getSession();
    return data?.session?.user?.app_metadata?.role === "admin";
  }

  async function fetchRows() {
    const { data, error } = await getClient().rpc("marcha_admin_list_organizers");
    if (error) throw error;
    return data || [];
  }

  function renderCard(o) {
    const status = STATUS[o.status] ? o.status : "pending";
    const head = el("div", { class: "admin-org-card__head" }, [
      el("div", {}, [
        el("h3", { class: "admin-org-card__name", text: o.name }),
        el("div", { class: "admin-org-card__meta", text: `${KIND[o.kind] || o.kind} · angemeldet ${formatDate(o.created_at)}${o.verified_at ? ` · freigegeben ${formatDate(o.verified_at)}` : ""}` })
      ]),
      el("span", { class: `admin-org-status admin-org-status--${status}`, text: STATUS[status] })
    ]);

    const website = safeUrl(o.website);
    const insta = String(o.instagram || "").replace(/^@/, "");
    const details = el("dl", { class: "admin-org-card__details" }, [
      el("dt", { text: "Kontakt" }), el("dd", { text: o.contact_person || "–" }),
      el("dt", { text: "Telefon" }), el("dd", {}, [o.phone ? el("a", { href: `tel:${o.phone.replace(/[^\d+]/g, "")}`, text: o.phone }) : document.createTextNode("–")]),
      el("dt", { text: "E-Mail" }), el("dd", {}, [o.email ? el("a", { href: `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(o.email)}`, target: "_blank", rel: "noopener", text: o.email }) : document.createTextNode("–")]),
      el("dt", { text: "Adresse" }), el("dd", { text: [o.address, o.city].filter(Boolean).join(", ") || "–" }),
      el("dt", { text: "Website" }), el("dd", {}, [website ? el("a", { href: website, target: "_blank", rel: "noopener", text: website }) : document.createTextNode("–")]),
      el("dt", { text: "Instagram" }), el("dd", {}, [insta ? el("a", { href: `https://instagram.com/${encodeURIComponent(insta)}`, target: "_blank", rel: "noopener", text: `@${insta}` }) : document.createTextNode("–")]),
      el("dt", { text: "Events" }), el("dd", { text: `${o.events_total} gesamt · ${o.events_pending} warten` })
    ]);

    const notes = el("textarea", { class: "admin-org-card__notes", rows: "2", maxlength: "2000", placeholder: "Interne Notiz (sieht nur ihr Admins), z. B. „telefonisch bestätigt am …“" });
    notes.value = o.admin_notes || "";

    const actions = el("div", { class: "admin-org-card__actions" });
    const addButton = (label, nextStatus, cls) => {
      const b = el("button", { type: "button", class: `button ${cls}`, text: label });
      b.addEventListener("click", () => save(o, nextStatus, notes.value, b));
      actions.append(b);
    };
    if (status !== "verified") addButton("✓ Freigeben", "verified", "button--primary");
    if (status !== "blocked") addButton("Sperren", "blocked", "button--ghost");
    if (status !== "pending") addButton("Zurück auf „In Prüfung“", "pending", "button--ghost");
    addButton("Notiz speichern", status, "button--ghost");

    return el("article", { class: `admin-org-card admin-org-card--${status}` }, [head, details, notes, actions]);
  }

  async function save(o, nextStatus, notes, button) {
    if (nextStatus === "blocked" && !window.confirm(`„${o.name}“ wirklich sperren? Das Konto kann dann nichts mehr eintragen oder ändern.`)) return;
    button.disabled = true;
    feedback("");
    try {
      const { error } = await getClient().rpc("marcha_admin_set_organizer", {
        p_id: o.id, p_status: nextStatus, p_admin_notes: notes
      });
      if (error) throw error;
      const done = nextStatus === o.status ? "Notiz gespeichert." :
        nextStatus === "verified" ? `„${o.name}“ ist freigegeben – eine Mail an den Veranstalter ist unterwegs.` :
        nextStatus === "blocked" ? `„${o.name}“ ist gesperrt.` : `„${o.name}“ steht wieder auf „In Prüfung“.`;
      await load();
      feedback(done, "success");
    } catch (error) {
      console.error("Veranstalter speichern fehlgeschlagen:", error);
      feedback(`Speichern fehlgeschlagen: ${error?.message || error}`, "error");
      button.disabled = false;
    }
  }

  async function load() {
    const list = $("adminOrganizersList");
    if (!list || loading) return;
    loading = true;
    try {
      if (!(await isAdmin())) return;
      const rows = await fetchRows();
      setBadge(rows);
      list.textContent = "";
      if (!rows.length) {
        list.append(el("p", { class: "card__intro", text: "Noch keine Veranstalter angemeldet." }));
        return;
      }
      rows.forEach((o) => list.append(renderCard(o)));
    } catch (error) {
      console.error("Veranstalter laden fehlgeschlagen:", error);
      feedback(`Laden fehlgeschlagen: ${error?.message || error}`, "error");
    } finally {
      loading = false;
    }
  }

  let lastSection = null;
  window.addEventListener("marcha-admin-nav", (ev) => {
    const section = ev.detail?.section;
    if (section === "organizers" && lastSection !== "organizers") void load();
    lastSection = section;
  });

  // Zähler im Menü beim Start und nach dem Anmelden aktualisieren.
  async function refreshBadge() {
    try {
      if (await isAdmin()) setBadge(await fetchRows());
    } catch (_e) { /* still */ }
  }
  window.addEventListener("load", () => {
    void refreshBadge();
    getClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void refreshBadge();
    });
  });
})();
