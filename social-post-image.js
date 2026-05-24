/**
 * Canonical social / Postiz image resolution for Marcha.
 * Browser (window.MarchaSocialPostImage), Node (module.exports), Deno (import).
 */
(function (root, factory) {
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof root !== "undefined") {
    root.MarchaSocialPostImage = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DEFAULT_SOCIAL_FALLBACK_IMAGE = "https://gomarcha.com/assets/social-preview-es.jpg";

  const GENERIC_PATH_HINTS = [
    "/social-preview",
    "social-preview.png",
    "social-preview-es.jpg",
    "/assets/logo",
    "logo.png",
    "logo.webp",
    "logo-schrift",
    "favicon",
    "app-icon",
    "app_icon",
    "icon-192",
    "icon-512",
    "apple-touch-icon",
    "promo",
    "/qr",
    "qrcode",
    "brand-marcha",
    "marcha-qr"
  ];

  const MARCHA_SITE_HOSTS = new Set(["gomarcha.com", "www.gomarcha.com"]);

  function isHttpsImageUrl(raw) {
    if (!raw || typeof raw !== "string") return false;
    const t = raw.trim();
    if (!/^https:\/\//i.test(t)) return false;
    try {
      return Boolean(new URL(t).hostname);
    } catch {
      return false;
    }
  }

  function isPostizUploadsHost(url) {
    try {
      return new URL(String(url || "").trim()).hostname.toLowerCase() === "uploads.postiz.com";
    } catch {
      return false;
    }
  }

  function normalizeFallbackUrl(fallbackUrl) {
    const t = String(fallbackUrl || DEFAULT_SOCIAL_FALLBACK_IMAGE).trim();
    return isHttpsImageUrl(t) ? t : DEFAULT_SOCIAL_FALLBACK_IMAGE;
  }

  function isGenericMarchaAssetUrl(url, configuredFallback) {
    const t = String(url || "").trim();
    if (!t) return true;
    const fb = normalizeFallbackUrl(configuredFallback).toLowerCase();
    if (fb && t.toLowerCase() === fb) return true;
    try {
      const u = new URL(t);
      const host = u.hostname.replace(/^www\./, "").toLowerCase();
      const p = u.pathname.toLowerCase();
      if (GENERIC_PATH_HINTS.some((h) => p.includes(h))) return true;
      if (MARCHA_SITE_HOSTS.has(host) && GENERIC_PATH_HINTS.some((h) => p.includes(h))) return true;
    } catch {
      return true;
    }
    return false;
  }

  function readStoredSourceImageUrl(record) {
    const pr = record?.postiz_response;
    if (!pr || typeof pr !== "object") return "";
    const direct = String(pr._marcha_source_image_url || "").trim();
    if (direct) return direct;
    const admin = pr._marcha_admin;
    if (admin && typeof admin === "object") {
      return String(admin.source_image_url || "").trim();
    }
    return "";
  }

  function queueResolvedAllowed(queueRow, configuredFallback) {
    const resolved = String(queueRow?.resolved_image_url || "").trim();
    if (!resolved || !isHttpsImageUrl(resolved)) return false;
    if (isGenericMarchaAssetUrl(resolved, configuredFallback)) return false;
    const storedSource = readStoredSourceImageUrl(queueRow);
    if (storedSource && isGenericMarchaAssetUrl(storedSource, configuredFallback)) return false;
    const queueImage = String(queueRow?.image_url || "").trim();
    if (queueImage && isGenericMarchaAssetUrl(queueImage, configuredFallback)) {
      if (isPostizUploadsHost(resolved)) return false;
    }
    return true;
  }

  function collectImageUrlsFromGallery(raw) {
    const out = [];
    if (!Array.isArray(raw)) return out;
    const objects = raw.filter((x) => x && (typeof x === "object" || typeof x === "string"));
    const featured = objects.find((e) => typeof e === "object" && e && e.featured === true);
    const ordered = featured ? [featured, ...objects.filter((x) => x !== featured)] : objects;
    for (const entry of ordered) {
      const u =
        typeof entry === "string" ? entry.trim() : String(entry?.url || entry?.image_url || entry?.src || "").trim();
      if (u) out.push(u);
    }
    return out;
  }

  function buildSocialPostImageCandidates(eventOrQueueRow, options = {}) {
    const fallbackUrl = normalizeFallbackUrl(options.fallbackUrl);
    const queueRow = eventOrQueueRow && typeof eventOrQueueRow === "object" ? eventOrQueueRow : {};
    const event =
      options.event && typeof options.event === "object"
        ? options.event
        : queueRow._event && typeof queueRow._event === "object"
          ? queueRow._event
          : null;

    const candidates = [];
    const seen = new Set();
    const push = (url, source, priority) => {
      const normalized = String(url || "").trim();
      if (!isHttpsImageUrl(normalized) || seen.has(normalized)) return;
      if (priority < 90 && isGenericMarchaAssetUrl(normalized, fallbackUrl)) return;
      seen.add(normalized);
      candidates.push({ url: normalized, source, priority });
    };

    if (queueResolvedAllowed(queueRow, fallbackUrl)) {
      push(queueRow.resolved_image_url, "queue.resolved_image_url", 1);
    }

    push(queueRow.image_url, "queue.image_url", 2);
    push(event?.resolved_image_url, "event.resolved_image_url", 3);
    push(event?.image_url, "event.image_url", 4);

    for (const u of collectImageUrlsFromGallery(event?.image_urls ?? queueRow.image_urls)) {
      push(u, "event.image_urls", 5);
    }

    push(fallbackUrl, "fallback_generic", 99);
    return { candidates, fallbackUrl };
  }

  function resolveSocialPostImage(eventOrQueueRow, options = {}) {
    const { candidates, fallbackUrl } = buildSocialPostImageCandidates(eventOrQueueRow, options);
    const nonGeneric = candidates.filter((c) => c.priority < 99);
    const pool = nonGeneric.length ? nonGeneric : candidates;
    const selected = pool[0] || { url: fallbackUrl, source: "fallback_generic", priority: 99 };
    const fallbackUsed = selected.priority >= 99 || selected.source === "fallback_generic";

    return {
      selectedImage: selected.url,
      source: selected.source,
      fallbackUsed,
      candidates: candidates.map((c) => ({ url: c.url, source: c.source, priority: c.priority }))
    };
  }

  async function validateImageReachable(url, fetchImpl) {
    const fetchFn = fetchImpl || (typeof fetch !== "undefined" ? fetch.bind(globalThis) : null);
    if (!fetchFn || !isHttpsImageUrl(url)) return { ok: false };
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 15000) : null;
    try {
      let res = await fetchFn(url, { method: "HEAD", signal: ctrl?.signal, redirect: "follow" });
      let ct = res.headers.get("content-type") || "";
      if (!res.ok || !/image\//i.test(ct)) {
        res = await fetchFn(url, {
          method: "GET",
          headers: { Range: "bytes=0-16384" },
          signal: ctrl?.signal,
          redirect: "follow"
        });
        ct = res.headers.get("content-type") || "";
      }
      return { ok: res.ok && /image\//i.test(ct), status: res.status, contentType: ct };
    } catch {
      return { ok: false };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function resolveSocialPostImageReachable(eventOrQueueRow, options = {}) {
    const base = resolveSocialPostImage(eventOrQueueRow, options);
    const fetchImpl = options.fetchImpl;
    const tryOrder = base.fallbackUsed
      ? base.candidates
      : base.candidates.filter((c) => c.priority < 99).length
        ? base.candidates.filter((c) => c.priority < 99)
        : base.candidates;

    const seen = new Set();
    for (const candidate of tryOrder) {
      if (seen.has(candidate.url)) continue;
      seen.add(candidate.url);
      const check = await validateImageReachable(candidate.url, fetchImpl);
      if (check.ok) {
        return {
          selectedImage: candidate.url,
          source: candidate.source,
          fallbackUsed: candidate.priority >= 99,
          candidates: base.candidates,
          reachable: true
        };
      }
    }

    const fb = normalizeFallbackUrl(options.fallbackUrl);
    const fbCheck = await validateImageReachable(fb, fetchImpl);
    if (fbCheck.ok) {
      return {
        selectedImage: fb,
        source: "fallback_generic",
        fallbackUsed: true,
        candidates: base.candidates,
        reachable: true
      };
    }

    return { ...base, reachable: false };
  }

  function logSocialImageResolution(logFn, context) {
    const payload = {
      eventId: context.eventId ?? null,
      queueId: context.queueId ?? null,
      selectedImage: context.selectedImage ?? "",
      source: context.source ?? "",
      fallbackUsed: Boolean(context.fallbackUsed),
      candidates: context.candidates ?? []
    };
    if (typeof logFn === "function") {
      logFn("SOCIAL IMAGE RESOLUTION", payload);
      if (payload.fallbackUsed) logFn("SOCIAL IMAGE FALLBACK USED", payload);
    } else {
      console.log("SOCIAL IMAGE RESOLUTION", payload);
      if (payload.fallbackUsed) console.warn("SOCIAL IMAGE FALLBACK USED", payload);
    }
  }

  return {
    DEFAULT_SOCIAL_FALLBACK_IMAGE,
    isHttpsImageUrl,
    isPostizUploadsHost,
    isGenericMarchaAssetUrl,
    buildSocialPostImageCandidates,
    resolveSocialPostImage,
    validateImageReachable,
    resolveSocialPostImageReachable,
    logSocialImageResolution
  };
});
