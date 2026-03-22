import { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createWeightEntry,
  deleteWeightEntry,
  getMyProfile,
  listWeightEntries,
  updateWeightEntry,
  upsertMyProfile,
  type CreateWeightEntryInput,
  type WeightEntry,
} from "@/lib/api";
import type { TrendPoint } from "@/components/ui/mini-area-chart";
import { SectionCard } from "@/components/ui/section-card";
import { TrendCard } from "@/components/ui/trend-card";
import {
  parseLocalizedDecimal,
  sanitizeDecimalInput,
  toLocalizedDecimalDisplay,
} from "@/lib/forms/decimal";

const weightQueryKey = ["weight-entries"];
const profileQueryKey = ["my-profile"];

type WeightFormState = {
  entryDate: string;
  weightKg: string;
  note: string;
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildDefaultFormState(): WeightFormState {
  return {
    entryDate: getTodayDate(),
    weightKg: "",
    note: "",
  };
}

function toFormState(entry: WeightEntry): WeightFormState {
  return {
    entryDate: entry.entryDate,
    weightKg: toLocalizedDecimalDisplay(entry.weightKg),
    note: entry.note ?? "",
  };
}

function formatEntryDate(value: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function buildWeightTrend(entries: WeightEntry[], days: number) {
  const recentEntries = [...entries].slice(0, days).reverse();
  const padding = Array.from({ length: Math.max(0, days - recentEntries.length) }, () => ({
    label: "",
    value: null,
  }));

  return [
    ...padding,
    ...recentEntries.map((entry) => ({
      label: formatShortDate(entry.entryDate),
      value: entry.weightKg,
    })),
  ];
}

function getDefinedValues(points: TrendPoint[]) {
  return points
    .map((point) => point.value)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

function calculateBmi(heightCm: number, weightKg: number) {
  const heightM = heightCm / 100;

  if (heightM <= 0) {
    return null;
  }

  return weightKg / (heightM * heightM);
}

function describeBmi(bmi: number | null) {
  if (bmi === null) {
    return "Adj meg magasságot a BMI kiszámításához.";
  }

  if (bmi < 18.5) {
    return "Sovány tartomány";
  }

  if (bmi < 25) {
    return "Normál tartomány";
  }

  if (bmi < 30) {
    return "Túlsúly tartomány";
  }

  return "Elhízás tartomány";
}

export function WeightPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<WeightFormState>(buildDefaultFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [heightDraft, setHeightDraft] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);

  const weightQuery = useQuery({
    queryKey: weightQueryKey,
    queryFn: listWeightEntries,
  });

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: getMyProfile,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: CreateWeightEntryInput & { id?: string | null }) => {
      if (input.id) {
        return updateWeightEntry(input.id, {
          entryDate: input.entryDate,
          weightKg: input.weightKg,
          note: input.note ?? null,
        });
      }

      return createWeightEntry(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: weightQueryKey });
      setForm(buildDefaultFormState());
      setEditingId(null);
      setFormError(null);
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Nem sikerült menteni a súlybejegyzést."
      );
    },
  });

  const profileMutation = useMutation({
    mutationFn: async (heightCm: number) => upsertMyProfile({ heightCm }),
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKey });
      setHeightDraft(toLocalizedDecimalDisplay(profile.heightCm));
      setProfileError(null);
    },
    onError: (error) => {
      setProfileError(
        error instanceof Error ? error.message : "Nem sikerült menteni a magasságot."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWeightEntry,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: weightQueryKey });
      if (editingId) {
        setEditingId(null);
        setForm(buildDefaultFormState());
      }
    },
  });

  const entries = useMemo(() => weightQuery.data ?? [], [weightQuery.data]);

  const summary = useMemo(() => {
    if (entries.length === 0) {
      return null;
    }

    const latest = entries[0];
    const previous = entries[1] ?? null;
    const delta = previous ? latest.weightKg - previous.weightKg : null;

    return {
      latest,
      delta,
      sevenDayAverage:
        entries
          .slice(0, 7)
          .reduce((total, entry) => total + entry.weightKg, 0) /
        Math.min(entries.length, 7),
    };
  }, [entries]);

  const trendPoints = useMemo<TrendPoint[]>(() => buildWeightTrend(entries, 14), [entries]);
  const trendValues = useMemo(() => getDefinedValues(trendPoints), [trendPoints]);
  const trendAverage =
    trendValues.length > 0
      ? trendValues.reduce((total, value) => total + value, 0) / trendValues.length
      : null;
  const trendRange =
    trendValues.length > 0
      ? `${Math.min(...trendValues).toFixed(1)} - ${Math.max(...trendValues).toFixed(1)} kg`
      : null;
  const fourteenDayDelta =
    trendValues.length >= 2 ? trendValues[trendValues.length - 1] - trendValues[0] : null;

  const profile = profileQuery.data ?? null;
  const latestWeightForBmi = summary?.latest.weightKg ?? profile?.startWeightKg ?? null;
  const bmi =
    profile?.heightCm && latestWeightForBmi
      ? calculateBmi(profile.heightCm, latestWeightForBmi)
      : null;

  useEffect(() => {
    if (profile?.heightCm) {
      setHeightDraft(toLocalizedDecimalDisplay(profile.heightCm));
    }
  }, [profile?.heightCm]);

  function updateForm<K extends keyof WeightFormState>(
    key: K,
    value: WeightFormState[K]
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

    const parsedWeight = parseLocalizedDecimal(form.weightKg);

    if (!form.entryDate) {
      setFormError("A dátum megadása kötelező.");
      return;
    }

    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      setFormError("A súly pozitív szám kell legyen.");
      return;
    }

    await saveMutation.mutateAsync({
      id: editingId,
      entryDate: form.entryDate,
      weightKg: Number(parsedWeight.toFixed(2)),
      note: form.note.trim() || null,
    });
  }

  async function handleHeightSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);

    const parsedHeight = parseLocalizedDecimal(heightDraft);

    if (!Number.isFinite(parsedHeight) || parsedHeight <= 0) {
      setProfileError("A magasság pozitív szám kell legyen.");
      return;
    }

    await profileMutation.mutateAsync(Number(parsedHeight.toFixed(2)));
  }

  return (
    <div className="page-stack">
      <SectionCard
        title="Súlynapló"
        description="Gyors reggeli rögzítés, rövid trendmemóriával."
        action={
          editingId ? (
            <button type="button" className="inline-action" onClick={resetForm}>
              Szerkesztés mégse
            </button>
          ) : null
        }
      >
        <div className="two-column-grid">
          <TrendCard
            eyebrow="Aktuális trend"
            title="14 pontos testsúlygrafikon"
            value={summary ? `${summary.latest.weightKg.toFixed(1)} kg` : "--"}
            detail={
              summary
                ? summary.delta === null
                  ? "Az első rögzített mérés megvan, most jöhet a trend felépítése."
                  : `${summary.delta > 0 ? "+" : ""}${summary.delta.toFixed(1)} kg az előző bejegyzéshez képest.`
                : "Kezdj egy egyszerű reggeli méréssel. A következetesség fontosabb, mint a részletek."
            }
            points={trendPoints}
            emptyMessage="Kezdd egy egyszerű reggeli méréssel, és hamar látszani fog a változás."
            tone="mint"
            stats={[
              {
                label: "14 napos átlag",
                value: trendAverage !== null ? `${trendAverage.toFixed(1)} kg` : "--",
              },
              {
                label: "Tartomány",
                value: trendRange ?? "--",
              },
              {
                label: "14 napos változás",
                value:
                  fourteenDayDelta !== null
                    ? `${fourteenDayDelta > 0 ? "+" : ""}${fourteenDayDelta.toFixed(1)} kg`
                    : "--",
              },
            ]}
          />

          <div className="page-stack">
            <div className="session-strip">
              <div>
                <p className="session-strip__label">BMI</p>
                <strong>
                  {bmi !== null ? bmi.toFixed(1) : "--"}
                </strong>
              </div>
              <div>
                <p className="session-strip__label">Állapot</p>
                <strong>{describeBmi(bmi)}</strong>
              </div>
              <div>
                <p className="session-strip__label">Magasság</p>
                <strong>{profile?.heightCm ? `${profile.heightCm.toFixed(1)} cm` : "--"}</strong>
              </div>
            </div>

            <form className="entry-form" onSubmit={handleHeightSubmit}>
              <label className="entry-form__field">
                <span>Magasság (cm)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="180 vagy 180,5"
                  value={heightDraft}
                  onChange={(event) => setHeightDraft(sanitizeDecimalInput(event.target.value))}
                  disabled={profileMutation.isPending}
                />
              </label>
              <div className="entry-form__actions">
                <button type="submit" className="inline-action" disabled={profileMutation.isPending}>
                  {profileMutation.isPending ? "Mentés..." : "Magasság mentése"}
                </button>
                {profileError ? <p className="auth-panel__error">{profileError}</p> : null}
              </div>
            </form>

            <form className="entry-form" onSubmit={handleSubmit}>
              <div className="entry-form__grid">
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
                  <span>Súly (kg)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="78 vagy 78,45"
                    value={form.weightKg}
                    onChange={(event) => updateForm("weightKg", sanitizeDecimalInput(event.target.value))}
                    disabled={saveMutation.isPending}
                    required
                  />
                </label>
              </div>
              <label className="entry-form__field">
                <span>Megjegyzés</span>
                <textarea
                  rows={3}
                  placeholder="Opcionális megjegyzés: alvás, utazás, visszatöltés..."
                  value={form.note}
                  onChange={(event) => updateForm("note", event.target.value)}
                  disabled={saveMutation.isPending}
                />
              </label>
              <div className="entry-form__actions">
                <button type="submit" className="auth-cta" disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? "Mentés..."
                    : editingId
                      ? "Bejegyzés frissítése"
                      : "Bejegyzés hozzáadása"}
                </button>
                {formError ? <p className="auth-panel__error">{formError}</p> : null}
              </div>
            </form>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Friss bejegyzések"
        description="A heti trendek és a következetesség alapja a napló."
      >
        {weightQuery.isLoading ? (
          <div className="placeholder-block">Súlyelőzmény betöltése...</div>
        ) : null}

        {weightQuery.isError ? (
          <div className="placeholder-block">
            {weightQuery.error instanceof Error
              ? weightQuery.error.message
              : "Nem sikerült betölteni a súlybejegyzéseket."}
          </div>
        ) : null}

        {!weightQuery.isLoading && !weightQuery.isError && entries.length === 0 ? (
          <div className="placeholder-block">
            Még nincs súlybejegyzés. Az első rögzítés legyen kevesebb mint 10 másodperc.
          </div>
        ) : null}

        {!weightQuery.isLoading && !weightQuery.isError && entries.length > 0 ? (
          <div className="stack-list">
            {entries.map((entry) => (
              <div key={entry.id} className="list-row">
                <div>
                  <strong>{formatEntryDate(entry.entryDate)}</strong>
                  <p>{entry.note ?? "Nincs megjegyzés."}</p>
                </div>
                <div className="list-row__actions">
                  <span>{entry.weightKg.toFixed(1)} kg</span>
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
            ))}
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
