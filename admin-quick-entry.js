/*
 * Marcha Admin – KI-Schnelleintrag (13.11.2026)
 *
 * Flyer (Bild) und/oder Text → Edge Function „event-extract“ (Claude) → vorausgefülltes Formular
 * → Admin prüft → Speichern legt das Event an (Bild im Ordner admin-replacements/quick/).
 * Rechte: nur Admins (Function prüft app_metadata.role, RLS prüft beim Speichern).
 */
(function () {
  "use strict";

  const SUPABASE_URL = "https://dwyhpirtbjfmohcnhdak.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable__H_WNdy1NIfoQbQfyNILKQ_Qb8wQfgn";
  const EXTRACT_URL = `${SUPABASE_URL}/functions/v1/event-extract`;
  const MAX_EDGE = 1600;
  const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  let client = null;
  let imageBlob = null;
  const getClient = () => (client ||= window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
  const $ = (id) => document.getElementById(id);

  function feedback(text, kind) {
    const el = $("quickFeedback");
    el.hidden = !text;
    el.textContent = text || "";
    el.className = `feedback${kind ? ` is-${kind}` : ""}`;
  }

  async function resize(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function session() {
    const { data } = await getClient().auth.getSession();
    return data?.session || null;
  }

  // ---------------------------------------------------------------- Formular
  const FIELDS = [
    ["name", "Name des Events *", "text"],
    ["recurrence", "Wiederholung", "recurrence"],
    ["event_date", "Datum (bei Serien: erster Termin) *", "date"],
    ["event_time", "Beginn *", "time"],
    ["end_time", "Ende", "time"],
    ["location_name", "Location *", "text"],
    ["address", "Adresse", "text"],
    ["city", "Ort *", "text"],
    ["genre", "Musikrichtung(en) *", "text"],
    ["artist_name", "Künstler / Band / DJ", "text"],
    ["price", "Preis", "price"],
    ["description_es", "Beschreibung Spanisch", "textarea"],
    ["description_en", "Beschreibung Englisch", "textarea"],
    ["description_de", "Beschreibung Deutsch", "textarea"],
    ["status", "Nach dem Speichern", "status"]
  ];

  function el(tag, attrs = {}, children = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "text") n.textContent = v; else n.setAttribute(k, v === true ? "" : v);
    }
    children.forEach((c) => c && n.append(c));
    return n;
  }

  function renderForm(ev) {
    const form = $("quickForm");
    form.textContent = "";
    const unsure = new Set((ev.uncertain || []).map(String));
    if (ev.notes) form.append(el("p", { class: "admin-quick__notes", text: `Hinweis der KI: ${ev.notes}` }));
    for (const [key, label, type] of FIELDS) {
      const wrap = el("div", { class: `admin-quick__field${unsure.has(key) || (key === "price" && (unsure.has("price_text") || unsure.has("is_free"))) || (key === "recurrence" && unsure.has("weekday")) ? " is-unsure" : ""}` });
      wrap.append(el("label", { for: `q_${key}`, text: label }));
      if (type === "textarea") {
        const t = el("textarea", { id: `q_${key}`, rows: "3", maxlength: "8000" });
        t.value = ev[key] || "";
        wrap.append(t);
      } else if (type === "recurrence") {
        const sel = el("select", { id: "q_recurrence" });
        sel.append(el("option", { value: "none", text: "Einmalig" }));
        WEEKDAYS.forEach((d, i) => sel.append(el("option", { value: String(i), text: `Jeden ${d}` })));
        sel.value = ev.is_weekly && ev.weekday !== null && ev.weekday !== undefined ? String(ev.weekday) : "none";
        wrap.append(sel);
      } else if (type === "price") {
        const free = el("input", { id: "q_is_free", type: "checkbox" });
        free.checked = ev.is_free === true;
        const price = el("input", { id: "q_price", type: "text", maxlength: "80", placeholder: "z. B. 10 €" });
        price.value = ev.price_text || "";
        wrap.append(el("label", { class: "admin-quick__inline" }, [free, document.createTextNode(" Eintritt frei")]), price);
      } else if (type === "status") {
        const sel = el("select", { id: "q_status" });
        sel.append(el("option", { value: "approved", text: "Sofort freigeben (online)" }));
        sel.append(el("option", { value: "pending", text: "In die Moderation (pending)" }));
        wrap.append(sel);
      } else {
        const input = el("input", { id: `q_${key}`, type, maxlength: key === "name" ? "300" : "200" });
        input.value = ev[key] || "";
        wrap.append(input);
      }
      form.append(wrap);
    }
    if (imageBlob) {
      const use = el("input", { id: "q_use_image", type: "checkbox" });
      use.checked = true;
      form.append(el("label", { class: "admin-quick__inline" }, [use, document.createTextNode(" Flyer als Event-Bild verwenden")]));
    }
    form.append(el("div", { id: "quickDuplicates", class: "admin-quick__dupes", hidden: true }));
    const actions = el("div", { class: "admin-quick__actions" });
    actions.append(el("button", { type: "submit", class: "button button--primary", text: "💾 Event speichern" }));
    const reset = el("button", { type: "button", class: "button button--ghost", text: "Verwerfen" });
    reset.addEventListener("click", resetAll);
    actions.append(reset);
    form.append(actions);
    form.hidden = false;
    void checkDuplicates(ev);
  }

  async function checkDuplicates(ev) {
    const box = $("quickDuplicates");
    const words = String(ev.name || "").split(/\s+/).filter((w) => w.length >= 4).slice(0, 2);
    if (!words.length) return;
    try {
      let q = getClient().from("events").select("id,name,event_date,status,is_recurring").neq("status", "rejected").limit(5);
      words.forEach((w) => { q = q.ilike("name", `%${w.replace(/[%_]/g, "")}%`); });
      const { data } = await q;
      if (data && data.length) {
        box.textContent = `Achtung, ähnliche Events gibt es schon: ${data.map((d) => `#${d.id} „${d.name}“ (${d.is_recurring ? "Serie" : d.event_date || "–"}, ${d.status})`).join(" · ")}`;
        box.hidden = false;
      }
    } catch (_e) { /* still */ }
  }

  function val(id) { return String($(id)?.value || "").trim(); }

  async function save(event) {
    event.preventDefault();
    const button = event.submitter || $("quickForm").querySelector("button[type=submit]");
    const required = { name: val("q_name"), event_date: val("q_event_date"), event_time: val("q_event_time"), location_name: val("q_location_name"), city: val("q_city"), genre: val("q_genre") };
    const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length) { feedback(`Bitte ausfüllen: ${missing.join(", ")}`, "error"); return; }
    const useImage = $("q_use_image")?.checked && imageBlob;
    if (!useImage && val("q_status") === "approved") {
      feedback("Ohne Bild kann das Event nicht direkt freigegeben werden – Bild verwenden oder „In die Moderation“ wählen.", "error");
      return;
    }
    button.disabled = true;
    feedback("Speichern …");
    try {
      let imageUrl = null;
      if (useImage) {
        const path = `admin-replacements/quick/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { error: upErr } = await getClient().storage.from("event-images").upload(path, imageBlob, { contentType: "image/jpeg", upsert: false });
        if (upErr) throw upErr;
        imageUrl = getClient().storage.from("event-images").getPublicUrl(path).data.publicUrl;
      }
      const recurrence = val("q_recurrence");
      const weekly = recurrence !== "none" && recurrence !== "";
      const isFree = $("q_is_free")?.checked;
      const row = {
        name: required.name,
        event_date: required.event_date,
        event_time: required.event_time,
        end_time: val("q_end_time") || null,
        location_name: required.location_name,
        address: val("q_address") || null,
        city: required.city,
        country: "España",
        genre: required.genre,
        artist_name: val("q_artist_name") || null,
        price_text: isFree ? "0 EUR" : (val("q_price") || null),
        description: val("q_description_es") || val("q_description_en") || val("q_description_de") || null,
        description_es: val("q_description_es") || null,
        description_en: val("q_description_en") || null,
        description_de: val("q_description_de") || null,
        image_url: imageUrl,
        image_urls: imageUrl ? [imageUrl] : null,
        status: val("q_status") || "pending",
        is_recurring: weekly,
        recurrence_type: weekly ? "weekly" : "none",
        recurrence_interval: 1,
        recurrence_weekday: weekly ? Number(recurrence) : null,
        recurrence_start_date: weekly ? required.event_date : null,
        recurring_social_enabled: weekly,
        submitted_by: "Marcha (KI-Schnelleintrag)",
        verification_notes: "Angelegt über KI-Schnelleintrag"
      };
      if (weekly && new Date(`${required.event_date}T12:00:00`).getDay() !== Number(recurrence)) {
        throw new Error(`Das Datum ist kein ${WEEKDAYS[Number(recurrence)]} – bitte Datum oder Wiederholung anpassen.`);
      }
      const { data, error } = await getClient().from("events").insert(row).select("id").maybeSingle();
      if (error) throw error;
      resetAll();
      feedback(`✅ Gespeichert: „${row.name}“ (#${data?.id ?? "?"}) – ${row.status === "approved" ? "ist online" : "wartet in der Moderation"}. Koordinaten für die Karte bitte im Event über „📍 Neu berechnen“ setzen.`, "success");
    } catch (error) {
      console.error("Schnelleintrag speichern fehlgeschlagen:", error);
      feedback(`Speichern fehlgeschlagen: ${error?.message || error}`, "error");
    } finally {
      button.disabled = false;
    }
  }

  function resetAll() {
    imageBlob = null;
    $("quickFile").value = "";
    $("quickText").value = "";
    $("quickPreview").hidden = true;
    $("quickForm").hidden = true;
    $("quickForm").textContent = "";
    feedback("");
  }

  async function extract() {
    const button = $("quickExtract");
    const text = $("quickText").value.trim();
    if (!text && !imageBlob) { feedback("Bitte einen Flyer hochladen oder Text einfügen.", "error"); return; }
    const s = await session();
    if (!s) { feedback("Bitte zuerst als Admin anmelden.", "error"); return; }
    button.disabled = true;
    feedback("KI liest aus … (ca. 10–30 Sekunden)");
    try {
      const body = { text };
      if (imageBlob) body.image = { data: await blobToBase64(imageBlob), media_type: "image/jpeg" };
      const res = await fetch(EXTRACT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${s.access_token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.event) throw new Error(data.error || `HTTP ${res.status}`);
      feedback("Bitte prüfen – gelb markierte Felder sind unsicher.", "success");
      renderForm(data.event);
    } catch (error) {
      feedback(`Auslesen fehlgeschlagen: ${error?.message || error}`, "error");
    } finally {
      button.disabled = false;
    }
  }

  function bind() {
    if (!$("quickExtract")) return;
    $("quickExtract").addEventListener("click", extract);
    $("quickForm").addEventListener("submit", save);
    $("quickFile").addEventListener("change", async () => {
      const file = $("quickFile").files?.[0];
      if (!file) { imageBlob = null; $("quickPreview").hidden = true; return; }
      try {
        imageBlob = await resize(file);
        $("quickPreview").src = URL.createObjectURL(imageBlob);
        $("quickPreview").hidden = false;
      } catch (_e) {
        imageBlob = null;
        feedback("Dieses Bild kann der Browser nicht lesen (z. B. HEIC) – bitte als JPG/PNG speichern oder einen Screenshot nehmen.", "error");
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})();
