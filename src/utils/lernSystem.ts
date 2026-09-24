export type LernRichtung = "deutsch" | "spanisch";

export type LernstandEintrag = {
  richtig: number;
  falsch: number;
  level: number;
  stufe: number;
  serie: number;
  intervallTage: number;
  naechsteWiederholung: number;
  letzteAntwort: number | null;
  deutschRichtig: number;
  deutschFalsch: number;
  spanischRichtig: number;
  spanischFalsch: number;
};

export type Lernstand = Record<string, LernstandEintrag>;

const INTERVALLE = [1, 3, 7, 14, 30, 60, 90];
const FALSCH_INTERVAL_MINUTEN = 10;

export function normalisiereLernstand(raw: unknown): Lernstand {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const result: Lernstand = {};

  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      continue;
    }

    const old = value as Record<string, unknown>;
    const level = clampNumber(old.level ?? old.stufe ?? 1, 1, 5);
    const richtig = positiveNumber(old.richtig);
    const falsch = positiveNumber(old.falsch);
    const serie = positiveNumber(old.serie);
    const intervallTage = positiveNumber(old.intervallTage);
    const naechsteWiederholung = positiveNumber(old.naechsteWiederholung);

    result[id] = {
      richtig,
      falsch,
      level,
      stufe: clampNumber(old.stufe ?? berechneStufe(level), 1, 3),
      serie,
      intervallTage: intervallTage || 0,
      naechsteWiederholung: naechsteWiederholung || Date.now(),
      letzteAntwort:
        typeof old.letzteAntwort === "number" ? old.letzteAntwort : null,
      deutschRichtig: positiveNumber(old.deutschRichtig),
      deutschFalsch: positiveNumber(old.deutschFalsch),
      spanischRichtig: positiveNumber(old.spanischRichtig),
      spanischFalsch: positiveNumber(old.spanischFalsch),
    };
  }

  return result;
}

function positiveNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}

function clampNumber(value: unknown, min: number, max: number): number {
  const number = typeof value === "number" && Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function berechneStufe(level: number): number {
  if (level >= 4) return 3;
  if (level >= 2) return 2;
  return 1;
}

export function neuerLernstand(
  bisher: LernstandEintrag | undefined,
  richtig: boolean,
  richtung: LernRichtung,
  jetzt = Date.now()
): LernstandEintrag {
  const basis: LernstandEintrag = bisher ?? {
    richtig: 0,
    falsch: 0,
    level: 1,
    stufe: 1,
    serie: 0,
    intervallTage: 0,
    naechsteWiederholung: jetzt,
    letzteAntwort: null,
    deutschRichtig: 0,
    deutschFalsch: 0,
    spanischRichtig: 0,
    spanischFalsch: 0,
  };

  const neueSerie = richtig ? basis.serie + 1 : 0;
  const neuesLevel = richtig
    ? Math.min(5, basis.level + 1)
    : Math.max(1, basis.level - 1);

  let neuesIntervall: number;
  let naechsteWiederholung: number;

  if (!richtig) {
    neuesIntervall = 0;
    naechsteWiederholung = jetzt + FALSCH_INTERVAL_MINUTEN * 60 * 1000;
  } else {
    const index = Math.min(neueSerie, INTERVALLE.length) - 1;
    neuesIntervall = INTERVALLE[Math.max(0, index)];
    naechsteWiederholung = jetzt + neuesIntervall * 24 * 60 * 60 * 1000;
  }

  return {
    richtig: basis.richtig + (richtig ? 1 : 0),
    falsch: basis.falsch + (richtig ? 0 : 1),
    level: neuesLevel,
    stufe: berechneStufe(neuesLevel),
    serie: neueSerie,
    intervallTage: neuesIntervall,
    naechsteWiederholung,
    letzteAntwort: jetzt,
    deutschRichtig:
      basis.deutschRichtig + (richtung === "deutsch" && richtig ? 1 : 0),
    deutschFalsch:
      basis.deutschFalsch + (richtung === "deutsch" && !richtig ? 1 : 0),
    spanischRichtig:
      basis.spanischRichtig + (richtung === "spanisch" && richtig ? 1 : 0),
    spanischFalsch:
      basis.spanischFalsch + (richtung === "spanisch" && !richtig ? 1 : 0),
  };
}

export function istFaellig(
  stand: LernstandEintrag | undefined,
  jetzt = Date.now()
): boolean {
  if (!stand) return true;
  return stand.naechsteWiederholung <= jetzt;
}

export function lernPrioritaet(
  stand: LernstandEintrag | undefined,
  jetzt = Date.now()
): number {
  if (!stand) return 1000000;

  const faelligkeit = Math.max(0, jetzt - stand.naechsteWiederholung);
  const fehlerquote = stand.falsch / Math.max(1, stand.richtig + stand.falsch);
  const levelFaktor = (6 - stand.level) * 100000;
  const fehlerFaktor = fehlerquote * 10000;

  return levelFaktor + fehlerFaktor + faelligkeit / 1000000;
}

export function sortiereIntelligent<T extends { id: string | number }>(
  vokabeln: T[],
  lernstand: Lernstand,
  jetzt = Date.now()
): T[] {
  return [...vokabeln].sort((a, b) => {
    const aStand = lernstand[String(a.id)];
    const bStand = lernstand[String(b.id)];

    const aDue = istFaellig(aStand, jetzt);
    const bDue = istFaellig(bStand, jetzt);

    if (aDue !== bDue) return aDue ? -1 : 1;

    const priorityDiff =
      lernPrioritaet(bStand, jetzt) - lernPrioritaet(aStand, jetzt);

    if (priorityDiff !== 0) return priorityDiff;
    return Math.random() - 0.5;
  });
}

export function waehleLernkarten<T extends { id: string | number }>(
  vokabeln: T[],
  lernstand: Lernstand,
  maxKarten = 20,
  jetzt = Date.now()
): T[] {
  const neu = vokabeln.filter((v) => !lernstand[String(v.id)]);
  const faelligeBekannte = vokabeln.filter((v) => {
    const stand = lernstand[String(v.id)];
    return !!stand && istFaellig(stand, jetzt);
  });

  // Fällige Wiederholungen kommen immer vor neuen Karten.
  // Dadurch werden überfällige Vokabeln nicht von neuen Karten verdrängt.
  const priorisierteFaellige = sortiereIntelligent(
    faelligeBekannte,
    lernstand,
    jetzt
  );

  const verbleibend = Math.max(0, maxKarten - priorisierteFaellige.length);
  const neueKarten = [...neu].sort(() => Math.random() - 0.5);
  const kandidaten = [
    ...priorisierteFaellige,
    ...neueKarten.slice(0, verbleibend),
  ];

  // Wenn heute nichts fällig ist und der Nutzer manuell weiterlernen möchte,
  // werden die aktuell schwächsten bekannten Karten angeboten.
  const basis = kandidaten.length > 0 ? kandidaten : vokabeln;
  const priorisiert =
    kandidaten.length > 0
      ? kandidaten
      : sortiereIntelligent(basis, lernstand, jetzt);

  return priorisiert.slice(0, Math.max(1, maxKarten));
}
