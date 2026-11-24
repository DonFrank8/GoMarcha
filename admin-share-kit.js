/*
 * Marcha Admin – „Bands & Lokale: Teil-Pakete“ (24.11.2026, Rat + Freigabe Frank)
 *
 * Ziel: Reichweite über die Fans der Bands und Lokale. Im Bereich „Social“ steht unter
 * „Diese Woche“ eine Liste der Events der nächsten 8 Tage. Pro Event:
 *   📤 Teil-Paket → Story-Bild (1080x1920, im Browser gezeichnet, echtes Event-Foto),
 *                   Link mit Messung (?source=wa_band / wa_venue) und fertige WhatsApp-Texte
 *                   (Band ES/EN, Lokal ES) zum Kopieren bzw. direkt Teilen.
 * Dazu: 📋 Facebook-Gruppen-Text (Englisch) für das kommende Wochenende (?source=fbgroup).
 * Es wird nichts automatisch verschickt – Frank schickt alles selbst und persönlich.
 * Nur lesen aus der Datenbank (RLS wie im übrigen Admin). Kein Secret im Browser.
 */
(function () {
  "use strict";

  const SUPABASE_URL = "https://dwyhpirtbjfmohcnhdak.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable__H_WNdy1NIfoQbQfyNILKQ_Qb8wQfgn";
  const TZ = "Europe/Madrid";
  const SITE = "https://www.gomarcha.com";
  const IG = "@go.marcha";
  const ORANGE = "#FF7A3D";
  const NAVY = "#0B1228";
  const DAYS_AHEAD = 8;
  const COLS = "id,name,artist_name,genre,event_date,event_time,location_name,city,image_url,price_text,status," +
    "is_recurring,recurrence_type,recurrence_weekday,recurrence_day_of_month,recurrence_start_date,recurrence_end_date," +
    "artist_instagram,venue_instagram";

  const ES_DAY = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const EN_DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const ES_MON = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const EN_MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DE_DAY = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  let client = null;
  let loaded = false;
  const $ = (id) => document.getElementById(id);
  function getClient() {
    if (!client) client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return client;
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

  // ── Datum (alles in Madrid-Zeit) ───────────────────────────────────────────
  const todayYmd = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  function addDays(ymd, n) {
    const d = new Date(`${ymd}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  const dow = (ymd) => new Date(`${ymd}T12:00:00Z`).getUTCDay();
  const dayNum = (ymd) => Number(ymd.slice(8, 10));
  const monIdx = (ymd) => Number(ymd.slice(5, 7)) - 1;
  const hhmm = (t) => String(t || "").slice(0, 5);

  /** Termine im Zeitraum [from, to] – Einzel-Events + Serien (weekly/monthly, nur Master). */
  function occurrences(events, from, to) {
    const out = [];
    for (const ev of events) {
      if (!ev.is_recurring) {
        if (ev.event_date && ev.event_date >= from && ev.event_date <= to) out.push({ ev, ymd: ev.event_date });
        continue;
      }
      const start = ev.recurrence_start_date || ev.event_date || from;
      const end = ev.recurrence_end_date || "9999-12-31";
      for (let d = from; d <= to; d = addDays(d, 1)) {
        if (d < start || d > end) continue;
        const type = String(ev.recurrence_type || "").toLowerCase();
        if (type === "weekly" && Number(ev.recurrence_weekday) === dow(d)) out.push({ ev, ymd: d });
        if (type === "monthly" && Number(ev.recurrence_day_of_month) === dayNum(d)) out.push({ ev, ymd: d });
      }
    }
    return out.sort((a, b) => (a.ymd + hhmm(a.ev.event_time)).localeCompare(b.ymd + hhmm(b.ev.event_time)));
  }

  async function loadEvents(from, to) {
    const c = getClient();
    const [single, series] = await Promise.all([
      c.from("events").select(COLS).eq("status", "approved").is("archived_at", null).is("original_event_id", null)
        .gte("event_date", from).lte("event_date", to),
      c.from("events").select(COLS).eq("status", "approved").is("archived_at", null).is("original_event_id", null)
        .eq("is_recurring", true)
    ]);
    if (single.error) throw single.error;
    if (series.error) throw series.error;
    const seen = new Set();
    const all = [...(single.data || []), ...(series.data || [])].filter((e) => !seen.has(e.id) && seen.add(e.id));
    return occurrences(all, from, to);
  }

  // ── Texte ────────────────────────────────────────────────────────────────────
  const who = (ev) => String(ev.artist_name || ev.name || "").trim();
  function genreWord(ev) {
    const g = String(ev.genre || "").split(/[,/]/)[0].trim();
    return g ? g.charAt(0).toUpperCase() + g.slice(1) : "Música";
  }
  const isFree = (ev) => /^\s*(0([.,]0+)?\s*(eur|€|euros?)?|gratis|free|entrada libre|eintritt frei)\s*$/i.test(String(ev.price_text || ""));
  function placeText(ev) {
    const v = String(ev.location_name || "").trim();
    const c = String(ev.city || "").trim();
    return [v, c && !v.toLowerCase().includes(c.toLowerCase()) ? c : ""].filter(Boolean).join(", ");
  }
  function whenEs(ymd) {
    const t = todayYmd();
    if (ymd === t) return "de hoy";
    if (ymd === addDays(t, 1)) return "de mañana";
    return `del ${ES_DAY[dow(ymd)]} ${dayNum(ymd)} ${ES_MON[monIdx(ymd)]}`;
  }
  function whenEn(ymd) {
    const t = todayYmd();
    if (ymd === t) return "tonight";
    if (ymd === addDays(t, 1)) return "tomorrow";
    return `on ${EN_DAY[dow(ymd)]} ${dayNum(ymd)} ${EN_MON[monIdx(ymd)]}`;
  }
  const eventLink = (ev, source) => `${SITE}/e/${encodeURIComponent(ev.id)}?source=${source}`;
  const orgLink = (source) => `${SITE}/veranstalter.html?source=${source}`;

  /** Mehrere Personen (Duo, Band, „A & B“) → im Spanischen „vosotros“ statt „tú“. */
  const isGroup = (name) => /(&|\+|\s(y|and)\s|\b(duo|dúo|trio|trío|band|banda|quartet|cuarteto|brothers|hermanos|orchestra|orquesta)\b|^the\s)/i.test(name);

  function texts(o) {
    const { ev, ymd } = o;
    const name = who(ev);
    const venue = String(ev.location_name || "").trim() || "la Costa";
    const bandEs = isGroup(name)
      ? `¡Hola ${name}! Soy Frank, de Marcha (gomarcha.com) 🎶 Vuestro concierto ${whenEs(ymd)} en ${venue} ya está en nuestra agenda:\n${eventLink(ev, "wa_band")}\n\nOs he preparado una imagen para vuestra story. Si la compartís y nos etiquetáis ${IG}, llega a más gente. ¡Mucha suerte!\n\nVuestras próximas fechas las podéis subir gratis aquí: ${orgLink("wa_band")}`
      : `¡Hola ${name}! Soy Frank, de Marcha (gomarcha.com) 🎶 Tu concierto ${whenEs(ymd)} en ${venue} ya está en nuestra agenda:\n${eventLink(ev, "wa_band")}\n\nTe he preparado una imagen para tu story. Si la compartes y nos etiquetas ${IG}, llega a más gente. ¡Mucha suerte!\n\nTus próximas fechas las puedes subir gratis aquí: ${orgLink("wa_band")}`;
    return [
      { key: "band_es", label: "Band (Spanisch)", text: bandEs },
      {
        key: "band_en", label: "Band (Englisch)",
        text: `Hi ${name}! I'm Frank from Marcha (gomarcha.com) 🎶 Your gig ${whenEn(ymd)} at ${venue} is already in our guide:\n${eventLink(ev, "wa_band")}\n\nI've made a story image for you. If you share it and tag us ${IG}, more people will see it. Have a great gig!\n\nYou can add your upcoming dates for free here: ${orgLink("wa_band")}`
      },
      {
        key: "venue_es", label: "Lokal (Spanisch)",
        text: `¡Hola! Soy Frank, de Marcha (gomarcha.com) 🎶 El concierto de ${name} ${whenEs(ymd)} en ${venue} ya está en nuestra agenda:\n${eventLink(ev, "wa_venue")}\n\nOs he preparado una imagen para vuestra story. Si la compartís y nos etiquetáis ${IG}, llega a más gente.\n\nVuestra agenda la podéis subir gratis aquí: ${orgLink("wa_venue")}`
      }
    ];
  }

  function fbGroupText(occs, from, to) {
    const range = `${EN_DAY[dow(from)].slice(0, 3)} ${dayNum(from)} – ${EN_DAY[dow(to)].slice(0, 3)} ${dayNum(to)} ${EN_MON[monIdx(to)]}`;
    const lines = [`🎶 Live music this weekend on the Costa del Sol (${range})`, ""];
    let last = "";
    for (const { ev, ymd } of occs) {
      if (ymd !== last) {
        if (last) lines.push("");
        lines.push(`${EN_DAY[dow(ymd)]} ${dayNum(ymd)} ${EN_MON[monIdx(ymd)]}`);
        last = ymd;
      }
      const g = String(ev.genre || "").split(/[,/]/)[0].trim().toLowerCase();
      lines.push(`• ${hhmm(ev.event_time) || "–"} ${who(ev)}${g ? ` (${g})` : ""} · ${placeText(ev)}${isFree(ev) ? " · free entry" : ""}`);
    }
    lines.push("", `All gigs, maps & details: ${SITE}/?source=fbgroup`, "Free listing – bands and venues can add their gigs on gomarcha.com 🙌");
    return lines.join("\n");
  }

  // ── Story-Bild (Canvas 1080x1920) ───────────────────────────────────────────
  function loadImage(url) {
    return new Promise((resolve) => {
      if (!/^https:\/\//i.test(String(url || ""))) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }
  /** Bild füllt das Feld; focusY 0 = oberer Rand, 0.5 = Mitte (Gesichter sitzen meist oben). */
  function cover(ctx, img, x, y, w, h, focusY = 0.5) {
    const r = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / r, sh = h / r;
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) * focusY, sw, sh, x, y, w, h);
  }
  function wrap(ctx, text, maxW) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = "";
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }
  function hook(ymd, time) {
    const t = todayYmd();
    if (ymd === t) return Number(hhmm(time).slice(0, 2) || 20) >= 17 ? ["¡ESTA NOCHE!", "TONIGHT"] : ["¡HOY!", "TODAY"];
    if (ymd === addDays(t, 1)) return ["¡MAÑANA!", "TOMORROW"];
    return [`ESTE ${ES_DAY[dow(ymd)].toUpperCase()}`, `THIS ${EN_DAY[dow(ymd)].toUpperCase()}`];
  }

  async function drawStory(o) {
    const { ev, ymd } = o;
    const W = 1080, H = 1920;
    const cv = el("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    try { await document.fonts?.load?.("700 80px Poppins"); } catch (_) { /* Schrift optional */ }
    const head = "Poppins, Inter, Arial, sans-serif";
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, W, H);
    const img = await loadImage(ev.image_url);
    let photoBottom = 1100;
    if (!img) {
      // Ohne Foto: oranger Lichtschein, Infoblock weiter oben
      const glow = ctx.createRadialGradient(W / 2, 760, 40, W / 2, 760, 760);
      glow.addColorStop(0, "rgba(255,122,61,0.55)");
      glow.addColorStop(1, "rgba(11,18,40,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      photoBottom = 760;
    }
    if (img) {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio <= 0.8) {
        // Hochformat (oft Flyer mit eigener Schrift): Foto nur oben, Ausschnitt oben angesetzt;
        // unten feste dunkle Fläche, damit nichts durch die Schrift scheint.
        photoBottom = 1180;
        cover(ctx, img, 0, 0, W, photoBottom, 0.15);
      } else {
        // Querformat: weicher Hintergrund (winzig gezeichnet, groß gezogen) + Foto in voller Breite
        const tiny = el("canvas");
        tiny.width = 27; tiny.height = 48;
        cover(tiny.getContext("2d"), img, 0, 0, 27, 48);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(tiny, 0, 0, W, H);
        ctx.fillStyle = "rgba(11,18,40,0.45)";
        ctx.fillRect(0, 0, W, H);
        const ph = Math.min(1000, Math.round(W / ratio));
        cover(ctx, img, 0, 420, W, ph);
        photoBottom = 420 + ph;
        // weicher Übergang an der Oberkante des Fotos
        const gt = ctx.createLinearGradient(0, 420, 0, 520);
        gt.addColorStop(0, "rgba(11,18,40,0.55)");
        gt.addColorStop(1, "rgba(11,18,40,0)");
        ctx.fillStyle = gt;
        ctx.fillRect(0, 420, W, 100);
      }
    }
    // Übergang Foto → feste dunkle Fläche (darunter liegt nur noch die Schrift)
    if (img) {
      const fadeTop = photoBottom - 320;
      const g = ctx.createLinearGradient(0, fadeTop, 0, photoBottom - 40);
      g.addColorStop(0, "rgba(11,18,40,0)");
      g.addColorStop(1, NAVY);
      ctx.fillStyle = g;
      ctx.fillRect(0, fadeTop, W, photoBottom - 40 - fadeTop);
      ctx.fillStyle = NAVY;
      ctx.fillRect(0, photoBottom - 40, W, H - (photoBottom - 40));
    }
    // Verlauf oben für den Aufhänger
    const g2 = ctx.createLinearGradient(0, 0, 0, 560);
    g2.addColorStop(0, "rgba(11,18,40,0.85)");
    g2.addColorStop(0.6, "rgba(11,18,40,0.6)");
    g2.addColorStop(1, "rgba(11,18,40,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, 560);

    // Aufhänger oben (unterhalb der Instagram-Kopfzeile)
    const [es, en] = hook(ymd, ev.event_time);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = `700 96px ${head}`;
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 24;
    ctx.fillText(es, W / 2, 330);
    ctx.font = `600 40px ${head}`;
    ctx.fillStyle = ORANGE;
    ctx.fillText(`${en} · LIVE MUSIC`, W / 2, 392);
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    // Infoblock unten (unterer Rand bleibt frei für Sticker)
    ctx.textAlign = "left";
    const x = 70, maxW = W - 140;
    let size = 112;
    ctx.font = `700 ${size}px ${head}`;
    let nameLines = wrap(ctx, who(ev), maxW);
    while ((nameLines.length > 2 || nameLines.some((l) => ctx.measureText(l).width > maxW)) && size > 60) {
      size -= 8;
      ctx.font = `700 ${size}px ${head}`;
      nameLines = wrap(ctx, who(ev), maxW);
    }
    nameLines = nameLines.slice(0, 2);
    const blockH = nameLines.length * size * 1.05 + 330;
    let y = img ? Math.max(photoBottom - 40, 1620 - blockH) : Math.max(photoBottom, 1400 - blockH);
    ctx.fillStyle = ORANGE;
    ctx.fillRect(x, y, 130, 12);
    y += 30;
    ctx.fillStyle = "#fff";
    for (const l of nameLines) { y += size; ctx.fillText(l, x, y); y += size * 0.05; }
    ctx.font = `700 56px ${head}`;
    ctx.fillStyle = ORANGE;
    y += 78;
    ctx.fillText(`${genreWord(ev)} en directo${isFree(ev) ? " · gratis" : ""}`, x, y);
    ctx.font = `600 50px ${head}`;
    ctx.fillStyle = "#fff";
    y += 80;
    const dateTxt = `${ES_DAY[dow(ymd)].slice(0, 3).replace(/^./, (c) => c.toUpperCase())} ${dayNum(ymd)} ${ES_MON[monIdx(ymd)]}${hhmm(ev.event_time) ? ` · ${hhmm(ev.event_time)}` : ""}`;
    ctx.fillText(dateTxt, x, y);
    ctx.font = `400 44px ${head}`;
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    y += 64;
    for (const l of wrap(ctx, `📍 ${placeText(ev)}`, maxW).slice(0, 2)) { ctx.fillText(l, x, y); y += 56; }
    ctx.font = `700 42px ${head}`;
    y += 34;
    ctx.fillStyle = "#fff";
    ctx.fillText("gomarcha.com", x, y);
    const w1 = ctx.measureText("gomarcha.com").width;
    ctx.fillStyle = ORANGE;
    ctx.fillText(`  ·  ${IG}`, x + w1, y);
    return cv;
  }

  // ── Anzeige ──────────────────────────────────────────────────────────────────
  function injectStyles() {
    if ($("adminShareKitStyles")) return;
    const s = el("style", { id: "adminShareKitStyles" });
    s.textContent = `
      .sk-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(148,163,184,.18); }
      .sk-row__info { min-width:0; flex:1 1 260px; }
      .sk-row__title { font-weight:800; margin:0; }
      .sk-row__meta { font-size:.85rem; opacity:.8; margin:2px 0 0; }
      .sk-tag { display:inline-block; font-size:.75rem; padding:1px 7px; border-radius:999px; border:1px solid rgba(148,163,184,.35); margin-left:6px; }
      .sk-overlay { position:fixed; inset:0; z-index:9999; background:rgba(3,7,18,.82); overflow:auto; padding:16px; }
      .sk-modal { max-width:760px; margin:0 auto; background:#0f172a; border:1px solid rgba(148,163,184,.3); border-radius:18px; padding:16px; }
      .sk-modal h3 { margin:0 0 8px; }
      .sk-grid { display:grid; grid-template-columns:minmax(0,260px) 1fr; gap:16px; }
      .sk-grid canvas { width:100%; height:auto; border-radius:12px; background:#111; }
      .sk-text { margin-bottom:12px; }
      .sk-text textarea { width:100%; min-height:120px; box-sizing:border-box; font:inherit; font-size:14px; border-radius:10px; padding:8px; }
      .sk-actions { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
      @media (max-width:640px){ .sk-grid { grid-template-columns:1fr; } .sk-grid canvas { max-width:300px; margin:0 auto; display:block; } }
    `;
    document.head.append(s);
  }

  function ensureContainer() {
    const view = $("adminViewSocial");
    if (!view) return null;
    let box = $("adminShareKit");
    if (box) return box;
    injectStyles();
    box = el("div", { id: "adminShareKit", class: "card card--glass" });
    box.innerHTML = `
      <h2 class="admin-view__h">📤 Bands &amp; Lokale – Teil-Pakete</h2>
      <p class="card__intro">Pro Event ein fertiges Story-Bild + WhatsApp-Text. Du schickst es persönlich an Band bzw. Lokal – sie teilen es mit ihren Fans und markieren ${IG}. Klicks werden gemessen (?source=wa_band / wa_venue / fbgroup).</p>
      <div class="sk-actions"><button type="button" class="btn-pill btn-pill--soft" id="adminShareKitFb">📋 Facebook-Gruppen-Text (Wochenende, Englisch)</button></div>
      <p id="adminShareKitFeedback" class="feedback" role="status" hidden></p>
      <div id="adminShareKitList"><p class="card__intro">Lade …</p></div>`;
    const week = $("adminSocialWeek");
    if (week && week.parentNode === view) week.after(box); else view.prepend(box);
    $("adminShareKitFb").addEventListener("click", () => void openFbGroup());
    return box;
  }

  function feedback(text, kind) {
    const f = $("adminShareKitFeedback");
    if (!f) return;
    f.hidden = !text;
    f.textContent = text || "";
    f.className = `feedback${kind ? ` is-${kind}` : ""}`;
  }

  async function load() {
    const box = ensureContainer();
    if (!box) return;
    const list = $("adminShareKitList");
    try {
      const { data: s } = await getClient().auth.getSession();
      if (s?.session?.user?.app_metadata?.role !== "admin") {
        list.innerHTML = `<p class="card__intro">Nur für Admins.</p>`;
        return;
      }
      const from = todayYmd();
      const occs = await loadEvents(from, addDays(from, DAYS_AHEAD - 1));
      list.innerHTML = "";
      if (!occs.length) {
        list.append(el("p", { class: "card__intro", text: "Keine Events in den nächsten Tagen." }));
        return;
      }
      for (const o of occs) {
        const ev = o.ev;
        const meta = `${DE_DAY[dow(o.ymd)]} ${dayNum(o.ymd)}.${monIdx(o.ymd) + 1}.${hhmm(ev.event_time) ? `, ${hhmm(ev.event_time)}` : ""} · ${placeText(ev)}`;
        const tags = [
          ev.artist_instagram ? `🎤 @${ev.artist_instagram}` : "🎤 Insta fehlt",
          ev.venue_instagram ? `📍 @${ev.venue_instagram}` : "📍 Insta fehlt"
        ];
        const b = el("button", { type: "button", class: "btn-pill btn-pill--hero", text: "📤 Teil-Paket" });
        b.addEventListener("click", () => void openKit(o));
        list.append(el("div", { class: "sk-row" }, [
          el("div", { class: "sk-row__info" }, [
            el("p", { class: "sk-row__title", text: who(ev) }),
            el("p", { class: "sk-row__meta", text: meta }, tags.map((t) => el("span", { class: "sk-tag", text: t })))
          ]),
          b
        ]));
      }
      loaded = true;
    } catch (err) {
      feedback(`Teil-Pakete konnten nicht geladen werden: ${err?.message || err}`, "error");
    }
  }

  function overlay(title) {
    const ov = el("div", { class: "sk-overlay", role: "dialog", "aria-modal": "true" });
    const modal = el("div", { class: "sk-modal" });
    const close = el("button", { type: "button", class: "btn-pill btn-pill--outline", text: "✕ Schließen" });
    close.addEventListener("click", () => ov.remove());
    ov.addEventListener("click", (e) => { if (e.target === ov) ov.remove(); });
    modal.append(el("div", { class: "sk-actions", style: "justify-content:space-between;align-items:center;margin:0 0 10px" }, [el("h3", { text: title }), close]));
    ov.append(modal);
    document.body.append(ov);
    return modal;
  }

  async function copy(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const ta = el("textarea");
      ta.value = text;
      document.body.append(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    const old = btn.textContent;
    btn.textContent = "✅ Kopiert";
    setTimeout(() => { btn.textContent = old; }, 1500);
  }

  function textBlock(label, text) {
    const ta = el("textarea");
    ta.value = text;
    const cp = el("button", { type: "button", class: "btn-pill btn-pill--soft", text: "📋 Kopieren" });
    cp.addEventListener("click", () => void copy(ta.value, cp));
    const wa = el("a", { class: "btn-pill btn-pill--soft", target: "_blank", rel: "noopener", text: "💬 WhatsApp" });
    const updateWa = () => wa.setAttribute("href", `https://wa.me/?text=${encodeURIComponent(ta.value)}`);
    ta.addEventListener("input", updateWa);
    updateWa();
    return el("div", { class: "sk-text" }, [el("strong", { text: label }), ta, el("div", { class: "sk-actions" }, [cp, wa])]);
  }

  async function openKit(o) {
    const ev = o.ev;
    const modal = overlay(`📤 ${who(ev)}`);
    const left = el("div");
    const right = el("div");
    modal.append(el("div", { class: "sk-grid" }, [left, right]));
    left.append(el("p", { class: "card__intro", text: "Bild wird gebaut …" }));
    const all = texts(o);
    all.forEach((t) => right.append(textBlock(t.label, t.text)));
    const handles = [ev.artist_instagram && `Band: @${ev.artist_instagram}`, ev.venue_instagram && `Lokal: @${ev.venue_instagram}`].filter(Boolean);
    right.append(el("p", { class: "card__intro", text: handles.length ? `Instagram: ${handles.join(" · ")} (Nachricht dort möglich, falls keine WhatsApp-Nummer)` : "Kein Instagram-Name hinterlegt – im Event-Editor eintragen." }));

    let canvas;
    try {
      canvas = await drawStory(o);
    } catch (err) {
      left.innerHTML = "";
      left.append(el("p", { class: "feedback is-error", text: `Bild konnte nicht gebaut werden: ${err?.message || err}` }));
      return;
    }
    left.innerHTML = "";
    left.append(canvas);
    if (!ev.image_url) left.append(el("p", { class: "card__intro", text: "Hinweis: Event hat kein Foto – Bild ohne Foto." }));
    let blob = null;
    try {
      blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.9));
    } catch (_) {
      left.append(el("p", { class: "feedback is-error", text: "Foto erlaubt keinen Export (fremde Seite). Bitte Foto im Event neu hochladen." }));
      return;
    }
    if (!blob) return;
    const fileName = `marcha-${String(who(ev)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${o.ymd}.jpg`;
    const file = new File([blob], fileName, { type: "image/jpeg" });
    const actions = el("div", { class: "sk-actions" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      const sh = el("button", { type: "button", class: "btn-pill btn-pill--hero", text: "📲 Bild teilen (WhatsApp …)" });
      sh.addEventListener("click", async () => {
        try { await navigator.share({ files: [file] }); } catch (_) { /* abgebrochen */ }
      });
      actions.append(sh);
    }
    const dl = el("a", { class: "btn-pill btn-pill--soft", download: fileName, href: URL.createObjectURL(blob), text: "⬇️ Bild speichern" });
    actions.append(dl);
    left.append(actions);
    left.append(el("p", { class: "card__intro", text: "Tipp: erst das Bild schicken, dann den Text." }));
  }

  async function openFbGroup() {
    feedback("");
    try {
      const t = todayYmd();
      const wd = dow(t);
      // kommendes Wochenende: Fr–So (ab Freitag bzw. heute, falls schon Wochenende)
      const fri = wd === 5 || wd === 6 || wd === 0 ? (wd === 5 ? t : wd === 6 ? addDays(t, -1) : addDays(t, -2)) : addDays(t, (5 - wd + 7) % 7);
      const from = fri < t ? t : fri;
      const sun = addDays(fri, 2);
      const occs = await loadEvents(from, sun);
      const modal = overlay("📋 Facebook-Gruppen-Text (Englisch)");
      if (!occs.length) {
        modal.append(el("p", { class: "card__intro", text: "Für das Wochenende sind noch keine Events eingetragen." }));
        return;
      }
      modal.append(el("p", { class: "card__intro", text: "In 2–4 Expat-Gruppen einfügen (vorher Gruppenregeln prüfen). Als Service-Liste, nicht als Werbung. Bild dazu: z. B. ein Teil-Paket-Bild." }));
      modal.append(textBlock(`${occs.length} Events · Wochenende`, fbGroupText(occs, from, sun)));
    } catch (err) {
      feedback(`Text konnte nicht erstellt werden: ${err?.message || err}`, "error");
    }
  }

  window.addEventListener("marcha-admin-nav", (ev) => {
    if (ev.detail?.section === "social") void load();
  });
  setTimeout(() => {
    const view = $("adminViewSocial");
    if (view && !view.hidden && !loaded) void load();
  }, 1700);
})();
