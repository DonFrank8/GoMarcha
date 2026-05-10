export type SocialStage = "approval" | "two_days_before" | "one_day_before" | "same_day" | "last_call";

type EventShape = {
  title?: string | null;
  name?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  location_name?: string | null;
  city?: string | null;
  country?: string | null;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function eventTitle(event: EventShape): string {
  return clean(event.title) || clean(event.name) || "Evento recomendado";
}

function eventLocation(event: EventShape): string {
  const location = [clean(event.location_name), clean(event.city), clean(event.country)].filter(Boolean).join(", ");
  return location || "cerca de ti";
}

function eventDateTime(event: EventShape): string {
  const date = clean(event.event_date);
  const time = clean(event.event_time);
  if (!date && !time) return "fecha por confirmar";
  if (!time) return date;
  return `${date} · ${time}`;
}

const STAGE_TEMPLATES: Record<SocialStage, string[]> = {
  approval: [
    "🔥 ¡Nuevo plan en Marcha! {title} llega {dateTime} en {location}.",
    "🎉 Recién aprobado en Marcha: {title} ({dateTime}) en {location}."
  ],
  two_days_before: [
    "⏳ Faltan 2 días para {title}. ¿Ya hiciste plan para {location}?",
    "🎵 En 2 días se viene {title} en {location}. ¡No te lo pierdas!"
  ],
  one_day_before: [
    "⚡ Mañana toca {title} en {location}. El plan perfecto está en Marcha.",
    "🌟 Cuenta atrás: {title} es mañana ({dateTime}) en {location}."
  ],
  same_day: [
    "☀️ Hoy es el día: {title} en {location}. Descubre más eventos cerca de ti en Marcha.",
    "📍 Plan para hoy: {title} ({dateTime}) en {location}. Marcha te guía."
  ],
  last_call: [
    "🚨 Última llamada: {title} empieza en breve en {location}.",
    "🎯 Aún llegas a {title} en {location}. Mira más eventos cerca de ti en Marcha."
  ]
};

export function buildSpanishCaption(event: EventShape, stage: SocialStage, eventUrl: string): string {
  const templates = STAGE_TEMPLATES[stage] || STAGE_TEMPLATES.approval;
  const template = templates[Math.floor(Math.random() * templates.length)] || templates[0];
  const text = template
    .replaceAll("{title}", eventTitle(event))
    .replaceAll("{dateTime}", eventDateTime(event))
    .replaceAll("{location}", eventLocation(event));
  return `${text}\n\n✨ Descubre eventos cerca de ti en Marcha.\n👉 ${eventUrl}\n#Marcha #EventosCercaDeTi`;
}
