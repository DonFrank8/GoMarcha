/** Canonical social / Postiz image resolution (mirrors /social-post-image.js). */

export const DEFAULT_SOCIAL_FALLBACK_IMAGE = "https://gomarcha.com/assets/social-preview-es.jpg";

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

export type ImageCandidate = { url: string; source: string; priority: number };

export type SocialImageResolution = {
  selectedImage: string;
  source: string;
  fallbackUsed: boolean;
  candidates: Array<{ url: string; source: string; priority: number }>;
  reachable?: boolean;
  /** Total HTTP attempts across all retry loops (for logging). */
  retryAttempts?: number;
};

export function isHttpsImageUrl(raw: string | null | undefined): boolean {
  if (!raw || typeof raw !== "string") return false;
  const t = raw.trim();
  if (!/^https:\/\//i.test(t)) return false;
  try {
    return Boolean(new URL(t).hostname);
  } catch {
    return false;
  }
}

export function isPostizUploadsHost(url: string): boolean {
  try {
    return new URL(String(url || "").trim()).hostname.toLowerCase() === "uploads.postiz.com";
  } catch {
    return false;
  }
}

function normalizeFallbackUrl(fallbackUrl?: string): string {
  const t = String(fallbackUrl || DEFAULT_SOCIAL_FALLBACK_IMAGE).trim();
  return isHttpsImageUrl(t) ? t : DEFAULT_SOCIAL_FALLBACK_IMAGE;
}

export function isGenericMarchaAssetUrl(url: string, configuredFallback?: string): boolean {
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

function readStoredSourceImageUrl(record: Record<string, unknown> | null | undefined): string {
  const pr = record?.postiz_response;
  if (!pr || typeof pr !== "object") return "";
  const root = pr as Record<string, unknown>;
  const direct = String(root._marcha_source_image_url || "").trim();
  if (direct) return direct;
  const admin = root._marcha_admin;
  if (admin && typeof admin === "object") {
    return String((admin as Record<string, unknown>).source_image_url || "").trim();
  }
  return "";
}

function queueResolvedAllowed(
  queueRow: Record<string, unknown> | null | undefined,
  configuredFallback: string
): boolean {
  const resolved = String(queueRow?.resolved_image_url || "").trim();
  if (!resolved || !isHttpsImageUrl(resolved)) return false;
  if (isGenericMarchaAssetUrl(resolved, configuredFallback)) return false;
  const storedSource = readStoredSourceImageUrl(queueRow);
  if (storedSource && isGenericMarchaAssetUrl(storedSource, configuredFallback)) return false;
  const queueImage = String(queueRow?.image_url || "").trim();
  if (queueImage && isGenericMarchaAssetUrl(queueImage, configuredFallback) && isPostizUploadsHost(resolved)) {
    return false;
  }
  return true;
}

function collectImageUrlsFromGallery(raw: unknown): string[] {
  const out: string[] = [];
  if (!Array.isArray(raw)) return out;
  const objects = raw.filter((x) => x && (typeof x === "object" || typeof x === "string"));
  const featured = objects.find((e) => typeof e === "object" && e && (e as { featured?: boolean }).featured === true);
  const ordered = featured ? [featured, ...objects.filter((x) => x !== featured)] : objects;
  for (const entry of ordered) {
    const u =
      typeof entry === "string"
        ? entry.trim()
        : String((entry as { url?: string; image_url?: string; src?: string }).url || "").trim();
    if (u) out.push(u);
  }
  return out;
}

export function buildSocialPostImageCandidates(
  eventOrQueueRow: Record<string, unknown> | null | undefined,
  options: { event?: Record<string, unknown> | null; fallbackUrl?: string } = {}
): { candidates: ImageCandidate[]; fallbackUrl: string } {
  const fallbackUrl = normalizeFallbackUrl(options.fallbackUrl);
  const queueRow = eventOrQueueRow && typeof eventOrQueueRow === "object" ? eventOrQueueRow : {};
  const event =
    options.event && typeof options.event === "object"
      ? options.event
      : queueRow._event && typeof queueRow._event === "object"
        ? (queueRow._event as Record<string, unknown>)
        : null;

  const candidates: ImageCandidate[] = [];
  const seen = new Set<string>();
  const push = (url: unknown, source: string, priority: number) => {
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

export function resolveSocialPostImage(
  eventOrQueueRow: Record<string, unknown> | null | undefined,
  options: { event?: Record<string, unknown> | null; fallbackUrl?: string } = {}
): SocialImageResolution {
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

export async function validateImageReachable(url: string, fetchImpl: typeof fetch): Promise<{ ok: boolean }> {
  if (!isHttpsImageUrl(url)) return { ok: false };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    let res = await fetchImpl(url, { method: "HEAD", signal: ctrl.signal, redirect: "follow" });
    let ct = res.headers.get("content-type") || "";
    if (!res.ok || !/image\//i.test(ct)) {
      res = await fetchImpl(url, {
        method: "GET",
        headers: { Range: "bytes=0-16384" },
        signal: ctrl.signal,
        redirect: "follow"
      });
      ct = res.headers.get("content-type") || "";
    }
    return { ok: res.ok && /image\//i.test(ct) };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Retrying wrapper for validateImageReachable.
 * Supabase Storage CDN propagation can take a few seconds after upload —
 * a single-shot check fails during that window and incorrectly falls back
 * to the generic fallback image.
 *
 * Strategy: up to `maxAttempts` tries with `delayMs` between each.
 * Returns on first success; returns { ok: false } only after all retries exhausted.
 */
export async function validateImageReachableWithRetry(
  url: string,
  fetchImpl: typeof fetch,
  opts: { maxAttempts?: number; delayMs?: number } = {}
): Promise<{ ok: boolean; attempts: number }> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const delayMs = opts.delayMs ?? 1500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await validateImageReachable(url, fetchImpl);
    if (result.ok) {
      if (attempt > 1) {
        console.log(`[image-retry] ok url=${url.slice(0, 120)} attempt=${attempt}/${maxAttempts}`);
      }
      return { ok: true, attempts: attempt };
    }
    console.log(`[image-retry] fail url=${url.slice(0, 120)} attempt=${attempt}/${maxAttempts}`);
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return { ok: false, attempts: maxAttempts };
}

export async function resolveSocialPostImageReachable(
  eventOrQueueRow: Record<string, unknown> | null | undefined,
  options: {
    event?: Record<string, unknown> | null;
    fallbackUrl?: string;
    fetchImpl?: typeof fetch;
  } = {}
): Promise<SocialImageResolution> {
  const fetchImpl = options.fetchImpl || fetch;
  const base = resolveSocialPostImage(eventOrQueueRow, options);
  const tryOrder = base.fallbackUsed
    ? base.candidates
    : base.candidates.filter((c) => c.priority < 99).length
      ? base.candidates.filter((c) => c.priority < 99)
      : base.candidates;

  const seen = new Set<string>();
  let totalAttempts = 0;

  for (const candidate of tryOrder) {
    if (seen.has(candidate.url)) continue;
    seen.add(candidate.url);

    // Real event images: retry up to 3×/1.5 s to survive CDN propagation delay.
    // Generic/fallback candidates: single shot is enough (static CDN, always reachable).
    const isGeneric = candidate.priority >= 99;
    let check: { ok: boolean; attempts: number };
    if (isGeneric) {
      const r = await validateImageReachable(candidate.url, fetchImpl);
      check = { ok: r.ok, attempts: 1 };
    } else {
      check = await validateImageReachableWithRetry(candidate.url, fetchImpl);
    }
    totalAttempts += check.attempts;

    if (check.ok) {
      return {
        selectedImage: candidate.url,
        source: candidate.source,
        fallbackUsed: isGeneric,
        candidates: base.candidates,
        reachable: true,
        retryAttempts: totalAttempts
      };
    }
  }

  // All candidates failed — last resort: ensure the configured fallback itself is reachable.
  const fb = normalizeFallbackUrl(options.fallbackUrl);
  const fbCheck = await validateImageReachable(fb, fetchImpl);
  totalAttempts += 1;
  if (fbCheck.ok) {
    return {
      selectedImage: fb,
      source: "fallback_generic",
      fallbackUsed: true,
      candidates: base.candidates,
      reachable: true,
      retryAttempts: totalAttempts
    };
  }

  return { ...base, reachable: false, retryAttempts: totalAttempts };
}

export function logSocialImageResolution(
  logFn: (msg: string, extra?: Record<string, unknown>) => void,
  context: {
    eventId?: string | null;
    queueId?: string | null;
    selectedImage?: string;
    source?: string;
    fallbackUsed?: boolean;
    candidates?: Array<{ url: string; source: string; priority: number }>;
    retryAttempts?: number;
    originalImageUrl?: string | null;
  }
): void {
  const payload = {
    eventId: context.eventId ?? null,
    queueId: context.queueId ?? null,
    selectedImage: context.selectedImage ?? "",
    source: context.source ?? "",
    fallbackUsed: Boolean(context.fallbackUsed),
    candidates: context.candidates ?? [],
    retryAttempts: context.retryAttempts ?? null,
    originalImageUrl: context.originalImageUrl ?? null
  };
  logFn("SOCIAL IMAGE RESOLUTION", payload);
  if (payload.fallbackUsed) logFn("SOCIAL IMAGE FALLBACK USED", payload);
}
