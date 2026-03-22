import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createMeasurementEntry,
  deleteMeasurementEntry,
  listMeasurementEntries,
  updateMeasurementEntry,
  type CreateMeasurementEntryInput,
  type MeasurementEntry,
} from "@/lib/api";
import { FeatureSection } from "@/components/ui/feature-section";
import {
  parseLocalizedDecimal,
  sanitizeDecimalInput,
} from "@/lib/forms/decimal";

const measurementQueryKey = ["measurement-entries"];

type MeasurementFormState = {
  entryDate: string;
  waistCm: string;
  hipsCm: string;
  chestCm: string;
  armCm: string;
  thighCm: string;
  neckCm: string;
};

type MeasurementFieldKey =
  | "waistCm"
  | "hipsCm"
  | "chestCm"
  | "armCm"
  | "thighCm"
  | "neckCm";

const measurementFields: Array<{
  key: MeasurementFieldKey;
  label: string;
  tone: "good" | "soft" | "warm";
}> = [
  { key: "waistCm", label: "Derék", tone: "good" },
  { key: "hipsCm", label: "Csípő", tone: "soft" },
  { key: "chestCm", label: "Mellkas", tone: "soft" },
  { key: "armCm", label: "Kar", tone: "good" },
  { key: "thighCm", label: "Comb", tone: "warm" },
  { key: "neckCm", label: "Nyak", tone: "soft" },
];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildDefaultFormState(): MeasurementFormState {
  return {
    entryDate: getTodayDate(),
    waistCm: "",
    hipsCm: "",
    chestCm: "",
    armCm: "",
    thighCm: "",
    neckCm: "",
  };
}

function toFormState(entry: MeasurementEntry): MeasurementFormState {
  return {
    entryDate: entry.entryDate,
    waistCm: entry.waistCm?.toString() ?? "",
    hipsCm: entry.hipsCm?.toString() ?? "",
    chestCm: entry.chestCm?.toString() ?? "",
    armCm: entry.armCm?.toString() ?? "",
    thighCm: entry.thighCm?.toString() ?? "",
    neckCm: entry.neckCm?.toString() ?? "",
  };
}

function formatEntryDate(value: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value));
}

function toNullableNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = parseLocalizedDecimal(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("A testméretek pozitív számok legyenek.");
  }

  return parsed;
}

function getFieldValue(entry: MeasurementEntry, key: MeasurementFieldKey) {
  return entry[key];
}

function getTrendLabel(current: number | null, previous: number | null) {
  if (current === null) {
    return "--";
  }

  if (previous === null) {
    return "Első rögzített adat";
  }

  const delta = current - previous;
  return `${delta > 0 ? "+" : ""}${delta.toFixed(1)} cm`;
}

export function MeasurementsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MeasurementFormState>(buildDefaultFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const measurementsQuery = useQuery({
    queryKey: measurementQueryKey,
    queryFn: listMeasurementEntries,
  });

  const saveMutation = useMutation({
    mutationFn: async (
      input: CreateMeasurementEntryInput & { id?: string | null }
    ) => {
      if (input.id) {
        return updateMeasurementEntry(input.id, input);
      }

      return createMeasurementEntry(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: measurementQueryKey });
      setForm(buildDefaultFormState());
      setEditingId(null);
      setFormError(null);
    },
    onError: (error) => {
      setFormError(
        error instanceof Error
          ? error.message
          : "Nem sikerült menteni a testméreteket."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMeasurementEntry,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: measurementQueryKey });
      if (editingId) {
        setEditingId(null);
        setForm(buildDefaultFormState());
      }
    },
  });

  const entries = measurementsQuery.data ?? [];

  const summary = useMemo(() => {
    const latest = entries[0] ?? null;
    const previous = entries[1] ?? null;

    return {
      latest,
      previous,
      cards: measurementFields.map((field) => ({
        key: field.key,
        label: field.label,
        tone: field.tone,
        value: latest ? getFieldValue(latest, field.key) : null,
        trend: latest
          ? getTrendLabel(
              getFieldValue(latest, field.key),
              previous ? getFieldValue(previous, field.key) : null
            )
          : "Még nincs adat",
      })),
      focusField:
        latest && latest.waistCm !== null
          ? {
              label: "Derék",
              value: latest.waistCm,
              trend: getTrendLabel(latest.waistCm, previous?.waistCm ?? null),
            }
          : null,
    };
  }, [entries]);

  function updateForm<K extends keyof MeasurementFormState>(
    key: K,
    value: MeasurementFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(buildDefaultFormState());
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.entryDate) {
      setFormError("A dátum megadása kötelező.");
      return;
    }

    let payload: CreateMeasurementEntryInput & { id?: string | null };

    try {
      payload = {
        id: editingId,
        entryDate: form.entryDate,
        waistCm: toNullableNumber(form.waistCm),
        hipsCm: toNullableNumber(form.hipsCm),
        chestCm: toNullableNumber(form.chestCm),
        armCm: toNullableNumber(form.armCm),
        thighCm: toNullableNumber(form.thighCm),
        neckCm: toNullableNumber(form.neckCm),
      };
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "A megadott mérések érvénytelenek."
      );
      return;
    }

    const hasAnyValue = measurementFields.some((field) => payload[field.key] !== null);

    if (!hasAnyValue) {
      setFormError("Legalább egy mérést adj meg.");
      return;
    }

    await saveMutation.mutateAsync(payload);
  }

  return (
    <div className="feature-page">
      <FeatureSection
        className="feature-section--hero feature-section--measurements"
        eyebrow="Jelzésellenőrzés"
        title="A testméretek most már valódi trendet adnak, nem statikus mintát."
        description="Ez a nézet az utolsó mérést, a változásokat és a következő rögzítést is egy helyen tartja."
        action={
          editingId ? (
            <button type="button" className="inline-action" onClick={resetForm}>
              Szerkesztés mégse
            </button>
          ) : null
        }
      >
        <div className="feature-hero">
          <div className="feature-hero__copy">
            <p className="feature-hero__lede">
              Heti visszajelzésnek számít a legtöbbet. A mostani nézet már a valódi
              méréseidből dolgozik, és azonnal mutatja a fő változásokat.
            </p>
            <div className="feature-chip-row">
              <span className="feature-chip feature-chip--accent">
                {summary.latest
                  ? `Utolsó mérés: ${formatEntryDate(summary.latest.entryDate)}`
                  : "Még nincs rögzített mérés"}
              </span>
              <span className="feature-chip">
                {summary.focusField
                  ? `${summary.focusField.label} ${summary.focusField.trend}`
                  : "A derék trendje lesz itt kiemelve"}
              </span>
              <span className="feature-chip feature-chip--muted">
                {entries.length} összes mérés
              </span>
            </div>
          </div>

          <aside className="feature-summary">
            <p className="feature-summary__label">Legfontosabb jelzés</p>
            <p className="feature-summary__value">
              {summary.focusField ? `${summary.focusField.value?.toFixed(1)} cm` : "--"}
            </p>
            <p className="feature-summary__detail">
              {summary.focusField
                ? `${summary.focusField.label} trend: ${summary.focusField.trend}`
                : "Kezdd egy egyszerű méréssel, és már látható lesz a fő változás."}
            </p>
            <ul className="feature-summary__list">
              <li className="feature-summary__item">
                <div>
                  <strong>Legutóbbi dátum</strong>
                  <span>Friss mérés</span>
                </div>
                <span>
                  {summary.latest ? formatEntryDate(summary.latest.entryDate) : "--"}
                </span>
              </li>
              <li className="feature-summary__item">
                <div>
                  <strong>Összes rögzítés</strong>
                  <span>Mérések száma</span>
                </div>
                <span>{entries.length}</span>
              </li>
            </ul>
          </aside>
        </div>
      </FeatureSection>

      <div className="feature-grid">
        {summary.cards.map((row) => (
          <article key={row.key} className="feature-metric">
            <p className="feature-metric__label">{row.label}</p>
            <p className="feature-metric__value">
              {row.value !== null ? `${row.value.toFixed(1)} cm` : "--"}
            </p>
            <p className={`feature-metric__detail feature-metric__detail--${row.tone}`}>
              {row.trend}
            </p>
          </article>
        ))}
      </div>

      <FeatureSection
        title={editingId ? "Mérés szerkesztése" : "Mérés hozzáadása"}
        description="Az összes támogatott testméret egy helyen szerkeszthető."
      >
        <form className="entry-form" onSubmit={handleSubmit}>
          <div className="entry-form__grid entry-form__grid--three">
            <label className="entry-form__field">
              <span>Dátum</span>
              <input
                type="date"
                value={form.entryDate}
                onChange={(event) => updateForm("entryDate", event.target.value)}
                disabled={saveMutation.isPending}
                required
              />
            </label>
            <label className="entry-form__field">
              <span>Derek (cm)</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.waistCm}
                onChange={(event) => updateForm("waistCm", sanitizeDecimalInput(event.target.value))}
                disabled={saveMutation.isPending}
              />
            </label>
            <label className="entry-form__field">
              <span>Csípő (cm)</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.hipsCm}
                onChange={(event) => updateForm("hipsCm", sanitizeDecimalInput(event.target.value))}
                disabled={saveMutation.isPending}
              />
            </label>
          </div>

          <div className="entry-form__grid entry-form__grid--three">
            <label className="entry-form__field">
              <span>Mellkas (cm)</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.chestCm}
                onChange={(event) => updateForm("chestCm", sanitizeDecimalInput(event.target.value))}
                disabled={saveMutation.isPending}
              />
            </label>
            <label className="entry-form__field">
              <span>Kar (cm)</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.armCm}
                onChange={(event) => updateForm("armCm", sanitizeDecimalInput(event.target.value))}
                disabled={saveMutation.isPending}
              />
            </label>
            <label className="entry-form__field">
              <span>Comb (cm)</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.thighCm}
                onChange={(event) => updateForm("thighCm", sanitizeDecimalInput(event.target.value))}
                disabled={saveMutation.isPending}
              />
            </label>
          </div>

          <label className="entry-form__field">
            <span>Nyak (cm)</span>
            <input
              type="text"
              inputMode="decimal"
              value={form.neckCm}
              onChange={(event) => updateForm("neckCm", sanitizeDecimalInput(event.target.value))}
              disabled={saveMutation.isPending}
            />
          </label>

          <div className="entry-form__actions">
            <button type="submit" className="auth-cta" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Mentés..."
                : editingId
                  ? "Mérés frissítése"
                  : "Mérés hozzáadása"}
            </button>
            {formError ? <p className="auth-panel__error">{formError}</p> : null}
          </div>
        </form>
      </FeatureSection>

      <FeatureSection
        title="Friss mérések"
        description="Az előzmény maradjon tömör, de már a valódi adataid alapján."
      >
        {measurementsQuery.isLoading ? (
          <div className="placeholder-block">Testméretek betöltése...</div>
        ) : null}

        {measurementsQuery.isError ? (
          <div className="placeholder-block">
            {measurementsQuery.error instanceof Error
              ? measurementsQuery.error.message
              : "Nem sikerült betölteni a testméreteket."}
          </div>
        ) : null}

        {!measurementsQuery.isLoading && !measurementsQuery.isError && entries.length === 0 ? (
          <div className="placeholder-block">
            Egyetlen mérés is ad irányt. Rögzíts egy gyors állapotképet, és a következő alkalommal már lesz mihez hasonlítani.
          </div>
        ) : null}

        {!measurementsQuery.isLoading && !measurementsQuery.isError && entries.length > 0 ? (
          <div className="feature-timeline">
            {entries.map((entry) => (
              <article key={entry.id} className="feature-timeline__item">
                <div className="feature-timeline__time">{formatEntryDate(entry.entryDate)}</div>
                <div>
                  <h3 className="feature-timeline__title">Testállapotkép</h3>
                  <p className="feature-timeline__detail">
                    {measurementFields
                      .map((field) => {
                        const value = entry[field.key];
                        return value !== null ? `${field.label} ${value.toFixed(1)} cm` : null;
                      })
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <div className="feature-pill-row">
                    <button
                      type="button"
                      className="inline-action"
                      onClick={() => {
                        setEditingId(entry.id);
                        setForm(toFormState(entry));
                        setFormError(null);
                      }}
                    >
                      Szerkesztés
                    </button>
                    <button
                      type="button"
                      className="inline-action inline-action--danger"
                      onClick={() => deleteMutation.mutate(entry.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Törlés
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </FeatureSection>
    </div>
  );
}
