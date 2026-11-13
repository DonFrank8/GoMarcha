/*
 * Marcha – KI-Hilfe im Formular „Event hinzufügen“ (13.11.2026)
 *
 * Eigene Datei (app.js bleibt unverändert). Fügt oben im Formular ein Feld ein:
 * Flyer hochladen und/oder Text einfügen → Edge Function „event-extract“ → leere Formularfelder
 * werden vorausgefüllt, der Flyer wird als Hauptbild übernommen. Der Mensch prüft und sendet ab.
 * Limits/Zugriff regelt die Function (ohne Konto 5/Tag, Veranstalter 20/Tag, Admin unbegrenzt).
 */
(function () {
  "use strict";

  const SUPABASE_URL = "https://dwyhpirtbjfmohcnhdak.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable__H_WNdy1NIfoQbQfyNILKQ_Qb8wQfgn";
  const EXTRACT_URL = `${SUPABASE_URL}/functions/v1/event-extract`;
  const LANGUAGE_STORAGE_KEY = "vibeon.language";
  const MAX_EDGE = 1600;

  const T = {
    de: {
      title: "⚡ Flyer hochladen – wir füllen das Formular für dich aus",
      file: "Flyer oder Foto",
      text: "…oder Text einfügen (z. B. Instagram-Post)",
      button: "Formular ausfüllen lassen",
      working: "Wird gelesen … (ca. 10–30 Sekunden)",
      done: "Fertig! Bitte alle Felder kurz prüfen – gelb markierte sind unsicher. Der Flyer ist als Hauptbild eingesetzt.",
      need: "Bitte einen Flyer auswählen oder Text einfügen.",
      error: "Das hat leider nicht geklappt. Bitte die Felder von Hand ausfüllen.",
      heic: "Dieses Bildformat kann der Browser nicht lesen – bitte einen Screenshot oder ein JPG nehmen.",
      hint: "Die KI macht nur einen Vorschlag. Du prüfst alles, bevor du absendest."
    },
    en: {
      title: "⚡ Upload a flyer – we'll fill in the form for you",
      file: "Flyer or photo",
      text: "…or paste text (e.g. an Instagram post)",
      button: "Fill in the form",
      working: "Reading … (about 10–30 seconds)",
      done: "Done! Please check every field – the ones in yellow are uncertain. The flyer has been added as the main image.",
      need: "Please choose a flyer or paste some text.",
      error: "Sorry, that didn't work. Please fill in the fields by hand.",
      heic: "Your browser can't read this image format – please use a screenshot or a JPG.",
      hint: "The AI only makes a suggestion. You check everything before sending."
    },
    es: {
      title: "⚡ Sube el cartel y rellenamos el formulario por ti",
      file: "Cartel o foto",
      text: "…o pega el texto (p. ej. un post de Instagram)",
      button: "Rellenar el formulario",
      working: "Leyendo … (unos 10–30 segundos)",
      done: "¡Listo! Revisa todos los campos: los marcados en amarillo son dudosos. El cartel se ha añadido como imagen principal.",
      need: "Elige un cartel o pega un texto.",
      error: "No ha funcionado. Rellena los campos a mano, por favor.",
      heic: "Tu navegador no puede leer este formato de imagen: usa una captura de pantalla o un JPG.",
      hint: "La IA solo hace una propuesta. Tú lo revisas todo antes de enviar."
    }
  };

  function lang() {
    try {
      const l = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (T[l]) return l;
    } catch (_e) { /* ignore */ }
    const b = String(navigator.language || "").slice(0, 2);
    return T[b] ? b : "es";
  }
  const t = (k) => T[lang()][k] || T.es[k];

  function injectStyles() {
    if (document.getElementById("submitAiStyles")) return;
    const style = document.createElement("style");
    style.id = "submitAiStyles";
    style.textContent = `
      .submit-ai { border: 1px dashed rgba(255,122,61,.7); border-radius: 14px; padding: 12px; margin: 0 0 14px; background: rgba(255,122,61,.07); display: grid; gap: 8px; }
      .submit-ai__title { margin: 0; font-weight: 700; }
      .submit-ai__hint { margin: 0; font-size: .85rem; opacity: .8; }
      .submit-ai textarea { width: 100%; box-sizing: border-box; min-height: 60px; font: inherit; font-size: 16px; border-radius: 10px; padding: 8px; }
      .submit-ai__status { margin: 0; font-size: .92rem; }
      .submit-ai__status.is-error { color: #ff8a8a; }
      .submit-ai-unsure input, .submit-ai-unsure select, .submit-ai-unsure textarea { outline: 2px solid #ffc857 !important; }
    `;
    document.head.append(style);
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
  function toBase64(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1] || "");
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  async function accessToken() {
    try {
      if (!window.supabase) return null;
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data } = await client.auth.getSession();
      return data?.session?.access_token || null;
    } catch (_e) {
      return null;
    }
  }

  function setField(id, value, unsure) {
    const el = document.getElementById(id);
    if (!el) return;
    if (value === null || value === undefined || value === "") {
      if (unsure && !String(el.value || "").trim()) el.closest(".field")?.classList.add("submit-ai-unsure");
      return;
    }
    if (String(el.value || "").trim()) return; // nichts überschreiben, was schon eingetragen ist
    el.value = String(value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    if (unsure) el.closest(".field")?.classList.add("submit-ai-unsure");
  }

  function apply(ev, file) {
    const unsure = new Set((ev.uncertain || []).map(String));
    const u = (k) => unsure.has(k);
    document.querySelectorAll(".submit-ai-unsure").forEach((n) => n.classList.remove("submit-ai-unsure"));
    setField("formName", ev.name, u("name"));
    setField("formLocationName", ev.location_name, u("location_name"));
    setField("formAddress", ev.address, u("address"));
    setField("formPostalCode", ev.postal_code, u("postal_code"));
    setField("formCity", ev.city, u("city"));
    setField("formCountry", "España", false);
    setField("formDate", ev.event_date, u("event_date"));
    setField("formTime", ev.event_time, u("event_time"));
    setField("formGenre", ev.genre, u("genre"));
    const artists = String(ev.artist_name || "").split(",").map((a) => a.trim()).filter(Boolean);
    setField("formArtistName", artists[0], u("artist_name"));
    if (artists.length > 1) setField("formAdditionalArtists", artists.slice(1).join(", "), u("artist_name"));
    const l = lang();
    setField("formDescription", ev[`description_${l}`] || ev.description_es || ev.description_en || ev.description_de, false);

    if (ev.is_weekly && ev.weekday !== null && ev.weekday !== undefined) {
      const type = document.getElementById("formRecurrenceType");
      if (type && type.value === "none") {
        type.value = "weekly";
        type.dispatchEvent(new Event("change", { bubbles: true }));
        setField("formRecurrenceWeekday", String(ev.weekday), u("weekday"));
        setField("formRecurrenceStartDate", ev.event_date, u("event_date"));
      }
    }

    const free = document.getElementById("formPriceFree");
    if (ev.is_free === true && free && !free.checked && !String(document.getElementById("formPrice")?.value || "").trim()) {
      free.checked = true;
      free.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (ev.price_text) {
      setField("formPrice", String(ev.price_text).replace(/[^\d.,]/g, "") || ev.price_text, u("price_text"));
    }

    const image = document.getElementById("formMainImage");
    if (file && image && !image.files?.length && typeof DataTransfer !== "undefined") {
      try {
        const dt = new DataTransfer();
        dt.items.add(file);
        image.files = dt.files;
        image.dispatchEvent(new Event("change", { bubbles: true }));
      } catch (_e) { /* Browser ohne DataTransfer: Bild bitte von Hand wählen */ }
    }
  }

  function build() {
    const form = document.getElementById("eventForm");
    if (!form || document.getElementById("submitAi")) return;
    injectStyles();
    const box = document.createElement("div");
    box.className = "submit-ai";
    box.id = "submitAi";
    box.innerHTML = `
      <p class="submit-ai__title" data-ai-t="title"></p>
      <label class="field field--full"><span data-ai-t="file"></span>
        <input id="submitAiFile" type="file" accept="image/jpeg,image/png,image/webp,image/*"></label>
      <label class="field field--full"><span data-ai-t="text"></span>
        <textarea id="submitAiText" maxlength="8000"></textarea></label>
      <button id="submitAiButton" type="button" class="button-secondary" data-ai-t="button"></button>
      <p id="submitAiStatus" class="submit-ai__status" role="status" aria-live="polite" hidden></p>
      <p class="submit-ai__hint" data-ai-t="hint"></p>`;
    form.prepend(box);
    const translate = () => box.querySelectorAll("[data-ai-t]").forEach((n) => { n.textContent = t(n.getAttribute("data-ai-t")); });
    translate();
    document.addEventListener("click", (e) => { if (e.target.closest("[data-lang-switch]")) setTimeout(translate, 50); });

    const status = (text, isError) => {
      const s = document.getElementById("submitAiStatus");
      s.hidden = !text;
      s.textContent = text || "";
      s.classList.toggle("is-error", Boolean(isError));
    };

    document.getElementById("submitAiButton").addEventListener("click", async () => {
      const button = document.getElementById("submitAiButton");
      const file = document.getElementById("submitAiFile").files?.[0] || null;
      const text = document.getElementById("submitAiText").value.trim();
      if (!file && !text) { status(t("need"), true); return; }
      button.disabled = true;
      status(t("working"));
      try {
        const body = { text };
        if (file) {
          let blob;
          try { blob = await resize(file); } catch (_e) { status(t("heic"), true); return; }
          body.image = { data: await toBase64(blob), media_type: "image/jpeg" };
        }
        const token = await accessToken();
        const res = await fetch(EXTRACT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token || SUPABASE_ANON_KEY}` },
          body: JSON.stringify(body)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.event) { status(data.limit ? data.error : t("error"), true); return; }
        apply(data.event, file);
        status(t("done"));
      } catch (_e) {
        status(t("error"), true);
      } finally {
        button.disabled = false;
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
