/*
 * Marcha – Seite für Veranstalter (Etappe B, 13.11.2026)
 *
 * Anmeldung per E-Mail-Link (Supabase Auth), Profil in public.organizers,
 * Liste der eigenen Events (RLS: organizer_id = auth.uid()).
 * Neue Events werden über das bestehende Formular der Hauptseite eingetragen
 * (index.html?submit=1). Die Anmeldung gilt dort automatisch mit (gleiche Domain),
 * und der Datenbank-Trigger marcha_events_guard ordnet das Event dem Konto zu.
 *
 * Sicherheit: Rechte entscheidet ausschließlich die Datenbank (RLS + Trigger).
 * Dieser Code liest nur fest benannte Spalten (keine Einreicher-Daten, keine admin_notes).
 */
(function () {
  "use strict";

  const SUPABASE_URL = "https://dwyhpirtbjfmohcnhdak.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable__H_WNdy1NIfoQbQfyNILKQ_Qb8wQfgn";
  const LANGUAGE_STORAGE_KEY = "vibeon.language"; // gleicher Schlüssel wie app.js – nicht umbenennen
  const ORGANIZER_COLUMNS = "id,name,kind,contact_person,phone,address,city,website,instagram,status,created_at,verified_at";
  const EVENT_COLUMNS = "id,name,title_de,title_en,title_es,event_date,event_time,end_time,location_name,address,city,genre,price_text,description,description_de,description_en,description_es,image_url,image_urls,status,is_recurring,recurrence_type,archived_at";
  const SMART_ACTION_URL = `${SUPABASE_URL}/functions/v1/smart-action`;
  const TRANSLATION_TARGET = { de: "German", en: "English", es: "Spanish" };
  const UPLOAD_MAX_EDGE_PX = 2000;

  const TEXT = {
    es: {
      title: "Para organizadores",
      lead: "Locales, bares, beach clubs, bandas y DJs: publicad vuestros eventos en Marcha. La cuenta es gratuita.",
      loading: "Cargando…",
      login_title: "Entrar",
      login_text: "Escribe tu e-mail y te enviamos un enlace para entrar. No necesitas contraseña.",
      email: "E-mail",
      login_button: "Enviar enlace",
      login_privacy: "Usamos tu e-mail solo para tu cuenta de organizador y para avisarte sobre tus eventos.",
      check_title: "Revisa tu correo",
      check_text: "Te hemos enviado un enlace. Ábrelo en este mismo dispositivo para entrar. Si no llega en unos minutos, mira en la carpeta de spam.",
      check_back: "Usar otro e-mail",
      profile_title_new: "Tus datos",
      profile_title_edit: "Editar datos",
      profile_text: "Los necesitamos una sola vez. Revisamos cada cuenta a mano; después, tus eventos se publican directamente.",
      f_name: "Nombre del local, banda o DJ *",
      f_kind: "Tipo *",
      kind_location: "Local / sala",
      kind_bar: "Bar / beach club / chiringuito",
      kind_band: "Banda / músico",
      kind_dj: "DJ",
      kind_other: "Otro",
      f_contact: "Persona de contacto *",
      f_phone: "Teléfono *",
      f_address: "Dirección *",
      f_city: "Localidad",
      f_website: "Web (opcional)",
      f_instagram: "Instagram (opcional)",
      save: "Guardar",
      cancel: "Cancelar",
      status_pending: "En revisión",
      status_verified: "Verificado",
      status_blocked: "Bloqueado",
      status_text_pending: "Estamos revisando tu cuenta (normalmente en 1–2 días). Ya puedes enviar eventos: los revisamos antes de publicarlos.",
      status_text_verified: "Tu cuenta está verificada. Tus eventos se publican directamente.",
      status_text_blocked: "Esta cuenta está bloqueada. Escríbenos a info@gomarcha.com si crees que es un error.",
      new_event: "+ Añadir evento",
      edit_profile: "Editar datos",
      photo_tip: "Consejo: una buena foto de la banda o del local funciona mejor que un cartel con mucho texto.",
      my_events: "Mis eventos",
      no_events: "Todavía no has añadido eventos.",
      ev_pending: "En revisión",
      ev_approved: "Publicado",
      ev_rejected: "No publicado",
      ev_archived: "Archivado",
      recurring: "Se repite",
      logged_in_as: "Conectado como",
      edit: "Editar",
      edit_title: "Editar evento",
      edit_recurring_note: "Evento que se repite: para cambiar los días, escríbenos a info@gomarcha.com.",
      e_image: "Foto *",
      e_name: "Nombre del evento *",
      e_date: "Fecha *",
      e_time: "Hora de inicio *",
      e_end_time: "Hora de fin (opcional)",
      e_location: "Local *",
      e_address: "Dirección",
      e_city: "Localidad *",
      e_genre: "Estilo de música *",
      e_price: "Precio (p. ej. 10 € o «Entrada libre»)",
      e_description: "Descripción",
      msg_need_image: "Añade una foto: sin foto el evento no se puede publicar.",
      msg_need_date: "Indica la fecha.",
      msg_saved_live: "Cambios guardados y publicados.",
      msg_saved_review: "Cambios guardados. Revisamos el evento antes de volver a publicarlo.",
      msg_uploading: "Subiendo foto…",
      logout: "Salir",
      back_home: "Volver a Marcha",
      privacy: "Privacidad",
      legal: "Aviso legal",
      msg_saved: "Datos guardados.",
      msg_error: "Algo ha fallado. Inténtalo de nuevo.",
      msg_rate: "Has pedido varios enlaces seguidos. Espera un minuto y vuelve a intentarlo.",
      msg_link_invalid: "El enlace ya no es válido. Pide uno nuevo.",
      admin_title: "Estás conectado como administrador",
      admin_text: "Esta página es para organizadores. Para moderar, usa el panel de administración. Para probar la página como organizador, sal y entra con otro e-mail (o usa una ventana privada).",
      admin_open: "Abrir administración"
    },
    en: {
      title: "For organizers",
      lead: "Venues, bars, beach clubs, bands and DJs: publish your events on Marcha. The account is free.",
      loading: "Loading…",
      login_title: "Sign in",
      login_text: "Enter your email and we'll send you a sign-in link. No password needed.",
      email: "Email",
      login_button: "Send link",
      login_privacy: "We only use your email for your organizer account and for messages about your events.",
      check_title: "Check your inbox",
      check_text: "We've sent you a link. Open it on this device to sign in. If it doesn't arrive within a few minutes, check your spam folder.",
      check_back: "Use a different email",
      profile_title_new: "Your details",
      profile_title_edit: "Edit details",
      profile_text: "We only need these once. We review every account by hand; after that, your events go live straight away.",
      f_name: "Name of venue, band or DJ *",
      f_kind: "Type *",
      kind_location: "Venue",
      kind_bar: "Bar / beach club / chiringuito",
      kind_band: "Band / musician",
      kind_dj: "DJ",
      kind_other: "Other",
      f_contact: "Contact person *",
      f_phone: "Phone *",
      f_address: "Address *",
      f_city: "Town",
      f_website: "Website (optional)",
      f_instagram: "Instagram (optional)",
      save: "Save",
      cancel: "Cancel",
      status_pending: "Under review",
      status_verified: "Verified",
      status_blocked: "Blocked",
      status_text_pending: "We're reviewing your account (usually within 1–2 days). You can already submit events; we'll check them before they go live.",
      status_text_verified: "Your account is verified. Your events go live straight away.",
      status_text_blocked: "This account is blocked. Email us at info@gomarcha.com if you think this is a mistake.",
      new_event: "+ Add event",
      edit_profile: "Edit details",
      photo_tip: "Tip: a good photo of the band or venue works better than a flyer full of text.",
      my_events: "My events",
      no_events: "You haven't added any events yet.",
      ev_pending: "Under review",
      ev_approved: "Live",
      ev_rejected: "Not published",
      ev_archived: "Archived",
      recurring: "Repeats",
      logged_in_as: "Signed in as",
      edit: "Edit",
      edit_title: "Edit event",
      edit_recurring_note: "Repeating event: to change the days, email us at info@gomarcha.com.",
      e_image: "Photo *",
      e_name: "Event name *",
      e_date: "Date *",
      e_time: "Start time *",
      e_end_time: "End time (optional)",
      e_location: "Venue *",
      e_address: "Address",
      e_city: "Town *",
      e_genre: "Music style *",
      e_price: "Price (e.g. €10 or “Free entry”)",
      e_description: "Description",
      msg_need_image: "Please add a photo: events without a photo can't be published.",
      msg_need_date: "Please enter the date.",
      msg_saved_live: "Changes saved and live.",
      msg_saved_review: "Changes saved. We'll review the event before it goes live again.",
      msg_uploading: "Uploading photo…",
      logout: "Sign out",
      back_home: "Back to Marcha",
      privacy: "Privacy",
      legal: "Legal notice",
      msg_saved: "Details saved.",
      msg_error: "Something went wrong. Please try again.",
      msg_rate: "You've requested several links in a row. Please wait a minute and try again.",
      msg_link_invalid: "This link is no longer valid. Please request a new one.",
      admin_title: "You're signed in as an admin",
      admin_text: "This page is for organizers. Please use the admin area for moderation. To test the page as an organizer, sign out and sign in with a different email (or use a private window).",
      admin_open: "Open admin area"
    },
    de: {
      title: "Für Veranstalter",
      lead: "Locations, Bars, Beachclubs, Bands und DJs: Tragt eure Events bei Marcha ein. Das Konto ist kostenlos.",
      loading: "Wird geladen …",
      login_title: "Anmelden",
      login_text: "Gib deine E-Mail-Adresse ein, wir schicken dir einen Anmelde-Link. Ein Passwort brauchst du nicht.",
      email: "E-Mail",
      login_button: "Link senden",
      login_privacy: "Wir nutzen deine E-Mail nur für dein Veranstalter-Konto und für Nachrichten zu deinen Events.",
      check_title: "Schau in dein Postfach",
      check_text: "Wir haben dir einen Link geschickt. Öffne ihn auf diesem Gerät, um dich anzumelden. Kommt nach ein paar Minuten nichts an, sieh im Spam-Ordner nach.",
      check_back: "Andere E-Mail verwenden",
      profile_title_new: "Deine Angaben",
      profile_title_edit: "Angaben bearbeiten",
      profile_text: "Wir brauchen sie nur einmal. Wir prüfen jedes Konto von Hand – danach gehen deine Events direkt online.",
      f_name: "Name der Location, Band oder des DJs *",
      f_kind: "Art *",
      kind_location: "Location / Saal",
      kind_bar: "Bar / Beachclub / Chiringuito",
      kind_band: "Band / Musiker",
      kind_dj: "DJ",
      kind_other: "Sonstiges",
      f_contact: "Ansprechpartner *",
      f_phone: "Telefon *",
      f_address: "Adresse *",
      f_city: "Ort",
      f_website: "Website (freiwillig)",
      f_instagram: "Instagram (freiwillig)",
      save: "Speichern",
      cancel: "Abbrechen",
      status_pending: "In Prüfung",
      status_verified: "Geprüft",
      status_blocked: "Gesperrt",
      status_text_pending: "Wir prüfen dein Konto (meist innerhalb von 1–2 Tagen). Du kannst schon Events eintragen – wir sehen sie uns vor der Veröffentlichung an.",
      status_text_verified: "Dein Konto ist geprüft. Deine Events gehen direkt online.",
      status_text_blocked: "Dieses Konto ist gesperrt. Schreib uns an info@gomarcha.com, wenn du das für einen Fehler hältst.",
      new_event: "+ Event eintragen",
      edit_profile: "Angaben bearbeiten",
      photo_tip: "Tipp: Ein gutes Foto der Band oder der Location wirkt besser als ein Flyer mit viel Text.",
      my_events: "Meine Events",
      no_events: "Du hast noch keine Events eingetragen.",
      ev_pending: "In Prüfung",
      ev_approved: "Online",
      ev_rejected: "Nicht veröffentlicht",
      ev_archived: "Archiviert",
      recurring: "Wiederholt sich",
      logged_in_as: "Angemeldet als",
      edit: "Bearbeiten",
      edit_title: "Event bearbeiten",
      edit_recurring_note: "Wiederkehrendes Event: Um die Tage zu ändern, schreib uns an info@gomarcha.com.",
      e_image: "Foto *",
      e_name: "Name des Events *",
      e_date: "Datum *",
      e_time: "Beginn *",
      e_end_time: "Ende (freiwillig)",
      e_location: "Location *",
      e_address: "Adresse",
      e_city: "Ort *",
      e_genre: "Musikrichtung *",
      e_price: "Preis (z. B. 10 € oder „Eintritt frei“)",
      e_description: "Beschreibung",
      msg_need_image: "Bitte füge ein Foto hinzu – ohne Foto kann das Event nicht veröffentlicht werden.",
      msg_need_date: "Bitte gib das Datum an.",
      msg_saved_live: "Änderungen gespeichert und online.",
      msg_saved_review: "Änderungen gespeichert. Wir sehen uns das Event an, bevor es wieder online geht.",
      msg_uploading: "Foto wird hochgeladen …",
      logout: "Abmelden",
      back_home: "Zurück zu Marcha",
      privacy: "Datenschutz",
      legal: "Impressum",
      msg_saved: "Angaben gespeichert.",
      msg_error: "Etwas ist schiefgelaufen. Bitte versuch es noch einmal.",
      msg_rate: "Du hast mehrere Links kurz hintereinander angefordert. Warte bitte eine Minute und versuch es dann noch einmal.",
      msg_link_invalid: "Der Link ist nicht mehr gültig. Bitte fordere einen neuen an.",
      admin_title: "Du bist als Admin angemeldet",
      admin_text: "Diese Seite ist für Veranstalter. Zum Moderieren nutze bitte den Admin-Bereich. Um die Seite als Veranstalter zu testen, melde dich ab und mit einer anderen E-Mail-Adresse an (oder nutze ein privates Fenster).",
      admin_open: "Admin-Bereich öffnen"
    }
  };

  const $ = (id) => document.getElementById(id);
  const VIEWS = ["viewLoading", "viewLogin", "viewCheckMail", "viewProfile", "viewDashboard", "viewAdmin", "viewEdit"];
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const state = { lang: "es", session: null, organizer: null, events: [], editing: null };

  // ---------------------------------------------------------------- Sprache
  function detectLanguage() {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl && TEXT[fromUrl]) return fromUrl;
    try {
      const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && TEXT[saved]) return saved;
    } catch (_e) { /* ignore */ }
    const browser = String(navigator.language || "").slice(0, 2).toLowerCase();
    return TEXT[browser] ? browser : "es";
  }
  function t(key) {
    return (TEXT[state.lang] && TEXT[state.lang][key]) || TEXT.es[key] || key;
  }
  function applyTexts() {
    document.documentElement.lang = state.lang;
    document.title = `Marcha | ${t("title")}`;
    document.querySelectorAll("[data-t]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-t"));
    });
    document.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang") === state.lang);
    });
    if (state.organizer) renderDashboard();
  }
  function setLanguage(lang) {
    if (!TEXT[lang]) return;
    state.lang = lang;
    try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang); } catch (_e) { /* ignore */ }
    applyTexts();
  }

  // ---------------------------------------------------------------- Anzeige
  function show(viewId) {
    VIEWS.forEach((id) => { $(id).hidden = id !== viewId; });
  }
  function message(text, kind) {
    const el = $("orgMessage");
    if (!text) { el.hidden = true; el.textContent = ""; return; }
    el.textContent = text;
    el.className = `org-message${kind ? ` is-${kind}` : ""}`;
    el.hidden = false;
  }
  function isAdminSession(session) {
    return session?.user?.app_metadata?.role === "admin";
  }

  // ---------------------------------------------------------------- Daten
  async function loadOrganizer() {
    const { data, error } = await client
      .from("organizers")
      .select(ORGANIZER_COLUMNS)
      .eq("id", state.session.user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function loadOwnEvents() {
    const { data, error } = await client
      .from("events")
      .select(EVENT_COLUMNS)
      .eq("organizer_id", state.session.user.id)
      .order("event_date", { ascending: false, nullsFirst: true })
      .limit(100);
    if (error) throw error;
    return data || [];
  }

  // ---------------------------------------------------------------- Ablauf
  async function route() {
    message("");
    if (!state.session) {
      show("viewLogin");
      return;
    }
    if (isAdminSession(state.session)) {
      // Admins legen hier kein Veranstalter-Profil an (Verwechslungsschutz).
      state.organizer = null;
      show("viewAdmin");
      return;
    }
    try {
      state.organizer = await loadOrganizer();
    } catch (error) {
      console.error("Organizer laden fehlgeschlagen:", error);
      message(t("msg_error"), "error");
      show("viewLogin");
      return;
    }
    if (!state.organizer) {
      openProfileForm(false);
      return;
    }
    renderDashboard();
    show("viewDashboard");
    await renderEvents();
  }

  function openProfileForm(isEdit) {
    const o = state.organizer || {};
    $("profileTitle").setAttribute("data-t", isEdit ? "profile_title_edit" : "profile_title_new");
    $("profileTitle").textContent = t(isEdit ? "profile_title_edit" : "profile_title_new");
    $("profileIntro").hidden = isEdit;
    $("cancelProfile").hidden = !isEdit;
    $("pName").value = o.name || "";
    $("pKind").value = o.kind || "location";
    $("pContact").value = o.contact_person || "";
    $("pPhone").value = o.phone || "";
    $("pAddress").value = o.address || "";
    $("pCity").value = o.city || "";
    $("pWebsite").value = o.website || "";
    $("pInstagram").value = o.instagram || "";
    show("viewProfile");
  }

  function normalizeWebsite(value) {
    const v = String(value || "").trim();
    if (!v) return null;
    return /^https?:\/\//i.test(v) ? v : `https://${v}`;
  }
  function normalizeInstagram(value) {
    const v = String(value || "").trim()
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/\/.*$/, "")
      .replace(/^@/, "");
    return v ? `@${v}` : null;
  }
  function textOrNull(value) {
    const v = String(value || "").trim();
    return v || null;
  }

  async function saveProfile(event) {
    event.preventDefault();
    const button = event.submitter || $("profileForm").querySelector("button[type=submit]");
    button.disabled = true;
    message("");
    const row = {
      name: $("pName").value.trim(),
      kind: $("pKind").value,
      contact_person: $("pContact").value.trim(),
      phone: $("pPhone").value.trim(),
      address: $("pAddress").value.trim(),
      city: textOrNull($("pCity").value),
      website: normalizeWebsite($("pWebsite").value),
      instagram: normalizeInstagram($("pInstagram").value)
    };
    try {
      let result;
      if (state.organizer) {
        result = await client.from("organizers").update(row).eq("id", state.session.user.id);
      } else {
        result = await client.from("organizers").insert({ id: state.session.user.id, ...row });
      }
      if (result.error) throw result.error;
      state.organizer = await loadOrganizer();
      renderDashboard();
      show("viewDashboard");
      await renderEvents();
      message(t("msg_saved"), "success");
    } catch (error) {
      console.error("Profil speichern fehlgeschlagen:", error);
      message(t("msg_error"), "error");
    } finally {
      button.disabled = false;
    }
  }

  function renderDashboard() {
    const o = state.organizer;
    if (!o) return;
    $("dashName").textContent = o.name;
    const status = ["pending", "verified", "blocked"].includes(o.status) ? o.status : "pending";
    const badge = $("dashStatus");
    badge.textContent = t(`status_${status}`);
    badge.className = `org-badge org-badge--${status}`;
    $("dashStatusText").textContent = t(`status_text_${status}`);
    $("dashEmail").textContent = `${t("logged_in_as")} ${state.session?.user?.email || ""}`;
    const newEventLink = document.querySelector('a[href^="./index.html?submit=1"]');
    if (newEventLink) {
      newEventLink.hidden = status === "blocked";
      newEventLink.href = `./index.html?submit=1&lang=${encodeURIComponent(state.lang)}`;
    }
  }

  function eventTitle(ev) {
    return ev[`title_${state.lang}`] || ev.name || ev.title_es || ev.title_en || ev.title_de || "–";
  }
  function formatDate(value) {
    if (!value) return "";
    const d = new Date(`${value}T12:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    const locale = { es: "es-ES", en: "en-GB", de: "de-DE" }[state.lang] || "es-ES";
    return d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  async function renderEvents() {
    const list = $("eventList");
    list.textContent = "";
    let events = [];
    try {
      events = await loadOwnEvents();
      state.events = events;
    } catch (error) {
      console.error("Events laden fehlgeschlagen:", error);
      message(t("msg_error"), "error");
    }
    $("eventEmpty").hidden = events.length > 0;
    events.forEach((ev) => {
      const li = document.createElement("li");
      const info = document.createElement("div");
      const title = document.createElement("div");
      title.className = "org-events__title";
      title.textContent = eventTitle(ev);
      const meta = document.createElement("div");
      meta.className = "org-events__meta";
      const parts = [
        ev.is_recurring ? t("recurring") : formatDate(ev.event_date),
        ev.event_time ? String(ev.event_time).slice(0, 5) : "",
        [ev.location_name, ev.city].filter(Boolean).join(" · ")
      ].filter(Boolean);
      meta.textContent = parts.join(" · ");
      info.append(title, meta);

      const status = ev.archived_at ? "archived" : (["pending", "approved", "rejected"].includes(ev.status) ? ev.status : "pending");
      const badge = document.createElement("span");
      badge.className = `org-badge org-badge--${status === "archived" ? "pending" : status}`;
      badge.textContent = t(`ev_${status}`);
      const side = document.createElement("div");
      side.className = "org-events__side";
      if (status === "approved") {
        const link = document.createElement("a");
        link.href = `/e/${encodeURIComponent(ev.id)}`;
        link.append(badge);
        side.append(link);
      } else {
        side.append(badge);
      }
      if (status !== "archived" && state.organizer?.status !== "blocked") {
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "org-link org-events__edit";
        edit.textContent = t("edit");
        edit.addEventListener("click", () => openEdit(ev));
        side.append(edit);
      }
      li.append(info, side);
      list.append(li);
    });
  }

  // ---------------------------------------------------------------- Bearbeiten (B2)
  function openEdit(ev) {
    state.editing = ev;
    message("");
    $("eName").value = eventTitle(ev) === "–" ? "" : (ev.name || eventTitle(ev));
    $("eDate").value = ev.event_date || "";
    $("eDateRow").hidden = Boolean(ev.is_recurring);
    $("eDate").required = !ev.is_recurring;
    $("editRecurringNote").hidden = !ev.is_recurring;
    $("eTime").value = ev.event_time ? String(ev.event_time).slice(0, 5) : "";
    $("eEndTime").value = ev.end_time ? String(ev.end_time).slice(0, 5) : "";
    $("eLocation").value = ev.location_name || "";
    $("eAddress").value = ev.address || "";
    $("eCity").value = ev.city || "";
    $("eGenre").value = ev.genre || "";
    $("ePrice").value = ev.price_text || "";
    $("eDescription").value = ev[`description_${state.lang}`] || ev.description || "";
    $("eImage").value = "";
    const preview = $("eImagePreview");
    preview.hidden = !ev.image_url;
    if (ev.image_url) preview.src = ev.image_url;
    show("viewEdit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function resizeImage(file) {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, UPLOAD_MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
      return blob || file;
    } catch (_e) {
      return file;
    }
  }

  async function uploadImage(file) {
    const blob = await resizeImage(file);
    const random = Math.random().toString(36).slice(2, 10);
    const path = `org/${state.session.user.id}/${Date.now()}-${random}.jpg`;
    const { error } = await client.storage.from("event-images").upload(path, blob, {
      contentType: "image/jpeg", upsert: false
    });
    if (error) throw error;
    const { data } = client.storage.from("event-images").getPublicUrl(path);
    if (!data?.publicUrl) throw new Error("no public url");
    return data.publicUrl;
  }

  async function translate(text, targetCode) {
    try {
      const res = await fetch(SMART_ACTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${state.session?.access_token || SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ text, targetLang: TRANSLATION_TARGET[targetCode] })
      });
      if (!res.ok) return null;
      const data = await res.json();
      const out = String(data?.translated || "").trim();
      return out || null;
    } catch (_e) {
      return null;
    }
  }

  async function saveEdit(event) {
    event.preventDefault();
    const ev = state.editing;
    if (!ev) return;
    const button = event.submitter || $("editForm").querySelector("button[type=submit]");
    const file = $("eImage").files?.[0] || null;
    if (!file && !ev.image_url) { message(t("msg_need_image"), "error"); return; }
    if (!ev.is_recurring && !$("eDate").value) { message(t("msg_need_date"), "error"); return; }
    button.disabled = true;
    message("");
    try {
      const patch = {
        name: $("eName").value.trim(),
        title_de: null, title_en: null, title_es: null, // sonst überdecken alte Übersetzungen den neuen Namen
        event_time: $("eTime").value,
        end_time: $("eEndTime").value || null,
        location_name: $("eLocation").value.trim(),
        address: textOrNull($("eAddress").value),
        city: $("eCity").value.trim(),
        genre: $("eGenre").value.trim(),
        price_text: textOrNull($("ePrice").value)
      };
      if (!ev.is_recurring) patch.event_date = $("eDate").value;

      const oldDescription = String(ev[`description_${state.lang}`] || ev.description || "").trim();
      const newDescription = $("eDescription").value.trim();
      if (newDescription !== oldDescription) {
        patch.description = newDescription || null;
        for (const code of ["es", "en", "de"]) {
          patch[`description_${code}`] = code === state.lang ? (newDescription || null)
            : (newDescription ? await translate(newDescription, code) : null);
        }
      }

      if (file) {
        message(t("msg_uploading"));
        const url = await uploadImage(file);
        const old = Array.isArray(ev.image_urls) ? ev.image_urls.filter((u) => typeof u === "string" && u !== url) : [];
        patch.image_url = url;
        patch.image_urls = [url, ...(ev.image_url && ev.image_url !== url ? [ev.image_url] : []), ...old].slice(0, 5);
      }

      const { error } = await client.from("events").update(patch).eq("id", ev.id);
      if (error) throw error;

      state.editing = null;
      show("viewDashboard");
      await renderEvents();
      const now = state.events.find((x) => x.id === ev.id);
      message(t(now?.status === "approved" ? "msg_saved_live" : "msg_saved_review"), "success");
    } catch (error) {
      console.error("Event speichern fehlgeschlagen:", error);
      message(t("msg_error"), "error");
    } finally {
      button.disabled = false;
    }
  }

  // ---------------------------------------------------------------- Login
  async function sendLoginLink(event) {
    event.preventDefault();
    const email = $("loginEmail").value.trim().toLowerCase();
    if (!email) return;
    const button = event.submitter || $("loginForm").querySelector("button[type=submit]");
    button.disabled = true;
    message("");
    try {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/veranstalter.html` }
      });
      if (error) throw error;
      show("viewCheckMail");
    } catch (error) {
      console.error("Login-Link fehlgeschlagen:", error);
      const rateLimited = error?.status === 429 || /rate|seconds/i.test(String(error?.message || ""));
      message(t(rateLimited ? "msg_rate" : "msg_error"), "error");
    } finally {
      button.disabled = false;
    }
  }

  function readLinkError() {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const code = hash.get("error_code") || query.get("error_code") || hash.get("error") || query.get("error");
    if (code) {
      history.replaceState(null, "", window.location.pathname);
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- Start
  function bind() {
    document.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => setLanguage(btn.getAttribute("data-lang")));
    });
    $("loginForm").addEventListener("submit", sendLoginLink);
    $("backToLogin").addEventListener("click", () => { message(""); show("viewLogin"); });
    $("profileForm").addEventListener("submit", saveProfile);
    $("cancelProfile").addEventListener("click", () => { message(""); show("viewDashboard"); });
    $("editProfile").addEventListener("click", () => { message(""); openProfileForm(true); });
    $("editForm").addEventListener("submit", saveEdit);
    $("cancelEdit").addEventListener("click", () => { state.editing = null; message(""); show("viewDashboard"); });
    $("eImage").addEventListener("change", () => {
      const file = $("eImage").files?.[0];
      const preview = $("eImagePreview");
      if (file) { preview.src = URL.createObjectURL(file); preview.hidden = false; }
    });
    const logout = async () => {
      await client.auth.signOut();
      state.session = null;
      state.organizer = null;
      route();
    };
    $("logoutButton").addEventListener("click", logout);
    $("adminLogout").addEventListener("click", logout);
  }

  async function start() {
    state.lang = detectLanguage();
    applyTexts();
    bind();
    const linkError = readLinkError();
    const { data } = await client.auth.getSession();
    state.session = data?.session || null;
    await route();
    if (linkError && !state.session) message(t("msg_link_invalid"), "error");

    client.auth.onAuthStateChange((authEvent, session) => {
      const changedUser = (session?.user?.id || null) !== (state.session?.user?.id || null);
      state.session = session || null;
      if (changedUser || authEvent === "SIGNED_OUT") {
        state.organizer = null;
        route();
      }
    });
  }

  start();
})();
