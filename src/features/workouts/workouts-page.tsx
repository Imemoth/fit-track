import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createWorkoutSession,
  deleteWorkoutSession,
  listWorkoutPlanTemplates,
  listWorkoutSessions,
  updateWorkoutSession,
  type WorkoutExerciseSet,
} from "@/lib/api";
import { FeatureSection } from "@/components/ui/feature-section";
import { parseLocalizedDecimal, sanitizeDecimalInput } from "@/lib/forms/decimal";
import { rankExerciseSuggestions } from "@/features/workouts/exercise-catalog";
import { getWorkoutTemplateCards } from "@/features/workouts/workout-template-adapter";

const workoutQueryKey = ["workout-sessions"];
const workoutTemplateQueryKey = ["workout-plan-templates"];
const templateCategories = ["Mind", "Kardió", "Otthoni edzés", "Edzőterem"];
const commonExerciseNames = [
  "Fekvenyomás",
  "Guggolás",
  "Felhúzás",
  "Lehúzás mellhez",
  "Vállból nyomás",
  "Kitörés",
  "Lábprés",
  "Román felhúzás",
  "Tolódzkodás",
  "Húzódzkodás",
  "Plank",
  "Futás",
  "Séta",
  "Kerékpár",
];

type ExerciseSetFormState = {
  reps: string;
  weightKg: string;
  restSeconds: string;
  durationMinutes: string;
  rounds: string;
  distanceKm: string;
};

type ExerciseFormState = {
  exerciseName: string;
  sets: ExerciseSetFormState[];
};

type WorkoutFormState = {
  sessionDate: string;
  title: string;
  durationMinutes: string;
  note: string;
  exercises: ExerciseFormState[];
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildDefaultSet(): ExerciseSetFormState {
  return {
    reps: "",
    weightKg: "",
    restSeconds: "",
    durationMinutes: "",
    rounds: "",
    distanceKm: "",
  };
}

function buildDefaultExercise(): ExerciseFormState {
  return { exerciseName: "", sets: [buildDefaultSet()] };
}

function buildDefaultFormState(): WorkoutFormState {
  return {
    sessionDate: getTodayDate(),
    title: "",
    durationMinutes: "",
    note: "",
    exercises: [buildDefaultExercise()],
  };
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = parseLocalizedDecimal(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function toSetFormState(set: WorkoutExerciseSet | undefined): ExerciseSetFormState {
  return {
    reps: typeof set?.reps === "string" ? set.reps : typeof set?.reps === "number" ? String(set.reps) : "",
    weightKg: typeof set?.weightKg === "number" ? String(set.weightKg) : "",
    restSeconds:
      typeof set?.restSeconds === "number"
        ? String(set.restSeconds)
        : typeof set?.restMin === "number"
          ? String(set.restMin)
          : "",
    durationMinutes:
      typeof set?.durationMinutes === "number"
        ? String(set.durationMinutes)
        : typeof set?.durationMin === "number"
          ? String(set.durationMin)
          : typeof set?.workMin === "number"
            ? String(set.workMin)
            : "",
    rounds: typeof set?.rounds === "number" ? String(set.rounds) : "",
    distanceKm: typeof set?.distanceKm === "number" ? String(set.distanceKm) : "",
  };
}

function buildSetSummary(set: WorkoutExerciseSet) {
  const parts: string[] = [];
  if (typeof set.reps === "number" || typeof set.reps === "string") parts.push(`${set.reps} ism.`);
  if (typeof set.weightKg === "number") parts.push(`${set.weightKg} kg`);
  if (typeof set.durationMinutes === "number") parts.push(`${set.durationMinutes} perc`);
  if (typeof set.durationMin === "number") parts.push(`${set.durationMin} perc`);
  if (typeof set.workMin === "number") parts.push(`${set.workMin} perc munka`);
  if (typeof set.rounds === "number") parts.push(`${set.rounds} kör`);
  if (typeof set.distanceKm === "number") parts.push(`${set.distanceKm} km`);
  if (typeof set.restSeconds === "number") parts.push(`${set.restSeconds} mp pihenő`);
  return parts.join(" · ");
}

function formatEntryDate(value: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value));
}

export function WorkoutsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<WorkoutFormState>(buildDefaultFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [templateCategory, setTemplateCategory] = useState("Mind");

  const workoutsQuery = useQuery({ queryKey: workoutQueryKey, queryFn: listWorkoutSessions });
  const workoutTemplatesQuery = useQuery({
    queryKey: workoutTemplateQueryKey,
    queryFn: listWorkoutPlanTemplates,
  });

  const templates = useMemo(
    () => getWorkoutTemplateCards(workoutTemplatesQuery.data),
    [workoutTemplatesQuery.data]
  );
  const filteredTemplates = useMemo(
    () => templates.filter((template) => templateCategory === "Mind" || template.category === templateCategory),
    [templateCategory, templates]
  );
  const sessions = workoutsQuery.data ?? [];
  const recentExerciseNames = useMemo(
    () => sessions.flatMap((session) => session.exercises.map((exercise) => exercise.exerciseName.trim())),
    [sessions]
  );
  const templateExerciseNames = useMemo(
    () => templates.flatMap((template) => template.exercises.map((exercise) => exercise.exerciseName.trim())),
    [templates]
  );

  const exerciseSuggestions = useMemo(() => {
    const activeQuery =
      form.exercises.find((exercise) => exercise.exerciseName.trim())?.exerciseName ?? "";

    return rankExerciseSuggestions(activeQuery, recentExerciseNames, templateExerciseNames);
  }, [form.exercises, recentExerciseNames, templateExerciseNames]);

  const saveMutation = useMutation({
    mutationFn: async (payload: ReturnType<typeof buildPayload> & { id?: string }) => {
      if (payload.id) return updateWorkoutSession(payload.id, payload);
      return createWorkoutSession(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workoutQueryKey });
      setForm(buildDefaultFormState());
      setEditingId(null);
      setFormError(null);
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : "Nem sikerült menteni az edzést.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkoutSession,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: workoutQueryKey }),
  });

  function updateForm<K extends keyof WorkoutFormState>(key: K, value: WorkoutFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateExerciseName(index: number, value: string) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index ? { ...exercise, exerciseName: value } : exercise
      ),
    }));
  }

  function updateSet(index: number, setIndex: number, key: keyof ExerciseSetFormState, value: string) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index
          ? {
              ...exercise,
              sets: exercise.sets.map((set, currentSetIndex) =>
                currentSetIndex === setIndex ? { ...set, [key]: value } : set
              ),
            }
          : exercise
      ),
    }));
  }

  function addExercise() {
    setForm((current) => ({ ...current, exercises: [...current.exercises, buildDefaultExercise()] }));
  }

  function addSet(exerciseIndex: number) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, index) =>
        index === exerciseIndex ? { ...exercise, sets: [...exercise.sets, buildDefaultSet()] } : exercise
      ),
    }));
  }

  function removeExercise(index: number) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.length === 1 ? [buildDefaultExercise()] : current.exercises.filter((_, i) => i !== index),
    }));
  }

  function removeSet(exerciseIndex: number, setIndex: number) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.length === 1 ? [buildDefaultSet()] : exercise.sets.filter((_, i) => i !== setIndex),
            }
          : exercise
      ),
    }));
  }

  function importTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setEditingId(null);
    setForm({
      sessionDate: getTodayDate(),
      title: template.title,
      durationMinutes: String(template.durationMinutes),
      note: template.description,
      exercises: template.exercises.map((exercise) => ({
        exerciseName: exercise.exerciseName,
        sets: exercise.sets.length > 0 ? exercise.sets.map(toSetFormState) : [buildDefaultSet()],
      })),
    });
    setFormError(null);
  }

  function startEdit(sessionId: string) {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return;
    setEditingId(session.id);
    setForm({
      sessionDate: session.sessionDate,
      title: session.title,
      durationMinutes: session.durationMinutes?.toString() ?? "",
      note: session.note ?? "",
      exercises: session.exercises.length > 0
        ? session.exercises.map((exercise) => ({
            exerciseName: exercise.exerciseName,
            sets: exercise.sets.length > 0 ? exercise.sets.map(toSetFormState) : [buildDefaultSet()],
          }))
        : [buildDefaultExercise()],
    });
    setFormError(null);
  }

  function buildPayload() {
    const durationMinutes = form.durationMinutes.trim() ? parseOptionalNumber(form.durationMinutes) : null;
    if (durationMinutes !== null && (!Number.isFinite(durationMinutes) || durationMinutes <= 0)) {
      throw new Error("Az edzésidő pozitív szám legyen.");
    }

    const exercises = form.exercises
      .map((exercise, index) => {
        const exerciseName = exercise.exerciseName.trim();
        if (!exerciseName) return null;

        const sets = exercise.sets
          .map((set) => {
            const nextSet: Record<string, unknown> = {};
            const repsNumber = Number(set.reps);
            if (set.reps.trim()) nextSet.reps = Number.isFinite(repsNumber) ? repsNumber : set.reps.trim();

            const weightKg = parseOptionalNumber(set.weightKg);
            const restSeconds = parseOptionalNumber(set.restSeconds);
            const durationMinutesValue = parseOptionalNumber(set.durationMinutes);
            const rounds = parseOptionalNumber(set.rounds);
            const distanceKm = parseOptionalNumber(set.distanceKm);

            if ([weightKg, restSeconds, durationMinutesValue, rounds, distanceKm].some(Number.isNaN)) {
              throw new Error("A szettek mezőiben csak érvényes számok szerepelhetnek.");
            }

            if (typeof weightKg === "number") nextSet.weightKg = weightKg;
            if (typeof restSeconds === "number") nextSet.restSeconds = restSeconds;
            if (typeof durationMinutesValue === "number") nextSet.durationMinutes = durationMinutesValue;
            if (typeof rounds === "number") nextSet.rounds = rounds;
            if (typeof distanceKm === "number") nextSet.distanceKm = distanceKm;

            return Object.keys(nextSet).length > 0 ? nextSet : null;
          })
          .filter((set): set is Record<string, unknown> => set !== null);

        return { exerciseName, sortOrder: index, sets };
      })
      .filter((exercise): exercise is NonNullable<typeof exercise> => exercise !== null);

    if (!form.sessionDate || !form.title.trim()) {
      throw new Error("A dátum és az edzés címe kötelező.");
    }

    return {
      sessionDate: form.sessionDate,
      title: form.title.trim(),
      durationMinutes,
      note: form.note.trim() || null,
      exercises,
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    try {
      const payload = buildPayload();
      await saveMutation.mutateAsync(editingId ? { id: editingId, ...payload } : payload);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Nem sikerült menteni az edzést.");
    }
  }

  return (
    <div className="feature-page">
      <FeatureSection
        className="feature-section--hero feature-section--workouts"
        title="Edzéstervsablonok"
        description="Gyors indulás kész sablonokkal."
      >
        <div className="feature-chip-row feature-chip-row--compact">
          {templateCategories.map((category) => (
            <button
              key={category}
              type="button"
              className={templateCategory === category ? "feature-chip feature-chip--accent" : "feature-chip"}
              onClick={() => setTemplateCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="template-grid">
          {filteredTemplates.map((template) => (
            <article key={template.id} className="template-card">
              <div className="template-card__header">
                <div>
                  <p className="template-card__eyebrow">{template.category}</p>
                  <h3>{template.title}</h3>
                </div>
                <span className="feature-pill feature-pill--cool">{template.difficulty}</span>
              </div>
              <p className="template-card__description">{template.description}</p>
              <div className="feature-pill-row">
                <span className="feature-pill feature-pill--good">{template.durationMinutes} perc</span>
                <span className="feature-pill feature-pill--ghost">{template.exercises.length} gyakorlat</span>
                <button type="button" className="inline-action" onClick={() => importTemplate(template.id)}>
                  Sablon betöltése
                </button>
              </div>
            </article>
          ))}
        </div>
      </FeatureSection>

      <FeatureSection
        title={editingId ? "Edzés szerkesztése" : "Edzés hozzáadása"}
        description="A gyakorlatnévhez automatikus ajánlatok jelennek meg a gyakori és korábban használt elemekből."
      >
        <form className="entry-form" onSubmit={handleSubmit}>
          <div className="entry-form__grid entry-form__grid--three">
            <label className="entry-form__field">
              <span>Dátum</span>
              <input type="date" value={form.sessionDate} onChange={(event) => updateForm("sessionDate", event.target.value)} required />
            </label>
            <label className="entry-form__field">
              <span>Edzés címe</span>
              <input type="text" value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Toló nap" required />
            </label>
            <label className="entry-form__field">
              <span>Idő (perc)</span>
              <input type="text" inputMode="decimal" value={form.durationMinutes} onChange={(event) => updateForm("durationMinutes", sanitizeDecimalInput(event.target.value))} placeholder="48 vagy 48,5" />
            </label>
          </div>

          <label className="entry-form__field">
            <span>Jegyzet</span>
            <textarea rows={3} value={form.note} onChange={(event) => updateForm("note", event.target.value)} placeholder="Rövid kontextus az edzésről..." />
          </label>

          <div className="exercise-editor">
            <div className="exercise-editor__header">
              <div>
                <p className="feature-note__label">Gyakorlatok</p>
                <h3 className="exercise-editor__title">Mit csináltál, és mennyit?</h3>
              </div>
              <button type="button" className="inline-action" onClick={addExercise}>
                Gyakorlat hozzáadása
              </button>
            </div>

            <div className="exercise-editor__list">
              {form.exercises.map((exercise, exerciseIndex) => (
                <div key={`exercise-${exerciseIndex}`} className="exercise-editor__item">
                  <div className="entry-form__grid">
                    <label className="entry-form__field">
                      <span>Gyakorlat neve</span>
                      <input
                        type="text"
                        list="exercise-name-suggestions"
                        value={exercise.exerciseName}
                        onChange={(event) => updateExerciseName(exerciseIndex, event.target.value)}
                        placeholder="Például Fekvenyomás vagy Guggolás"
                      />
                    </label>
                    <div className="exercise-editor__actions">
                      <span className="exercise-editor__order">Sorrend: {exerciseIndex + 1}</span>
                      <button type="button" className="inline-action inline-action--danger" onClick={() => removeExercise(exerciseIndex)}>
                        Törlés
                      </button>
                    </div>
                  </div>

                  <div className="exercise-set-list">
                    {exercise.sets.map((set, setIndex) => (
                      <div key={`exercise-${exerciseIndex}-set-${setIndex}`} className="exercise-set-card">
                        <div className="exercise-set-card__header">
                          <strong>{setIndex + 1}. szett</strong>
                          <button type="button" className="inline-action inline-action--danger" onClick={() => removeSet(exerciseIndex, setIndex)}>
                            Szetttörlés
                          </button>
                        </div>

                        <div className="entry-form__grid entry-form__grid--three">
                          <label className="entry-form__field">
                            <span>Ismétlés</span>
                            <input type="text" inputMode="numeric" value={set.reps} onChange={(event) => updateSet(exerciseIndex, setIndex, "reps", event.target.value)} placeholder="8 vagy 8-10" />
                          </label>
                          <label className="entry-form__field">
                            <span>Súly (kg)</span>
                            <input type="text" inputMode="decimal" value={set.weightKg} onChange={(event) => updateSet(exerciseIndex, setIndex, "weightKg", sanitizeDecimalInput(event.target.value))} placeholder="72,5" />
                          </label>
                          <label className="entry-form__field">
                            <span>Pihenő (mp)</span>
                            <input type="text" inputMode="numeric" value={set.restSeconds} onChange={(event) => updateSet(exerciseIndex, setIndex, "restSeconds", event.target.value)} placeholder="90" />
                          </label>
                        </div>

                        <div className="entry-form__grid entry-form__grid--three">
                          <label className="entry-form__field">
                            <span>Időtartam (perc)</span>
                            <input type="text" inputMode="decimal" value={set.durationMinutes} onChange={(event) => updateSet(exerciseIndex, setIndex, "durationMinutes", sanitizeDecimalInput(event.target.value))} placeholder="5 vagy 5,5" />
                          </label>
                          <label className="entry-form__field">
                            <span>Körök</span>
                            <input type="text" inputMode="numeric" value={set.rounds} onChange={(event) => updateSet(exerciseIndex, setIndex, "rounds", event.target.value)} placeholder="3" />
                          </label>
                          <label className="entry-form__field">
                            <span>Táv (km)</span>
                            <input type="text" inputMode="decimal" value={set.distanceKm} onChange={(event) => updateSet(exerciseIndex, setIndex, "distanceKm", sanitizeDecimalInput(event.target.value))} placeholder="2,5" />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button type="button" className="inline-action" onClick={() => addSet(exerciseIndex)}>
                    Új szett
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="entry-form__actions">
            <button type="submit" className="auth-cta" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Mentés..." : editingId ? "Edzés frissítése" : "Edzés hozzáadása"}
            </button>
            {formError ? <p className="auth-panel__error">{formError}</p> : null}
          </div>
        </form>
      </FeatureSection>

      <FeatureSection title="Rögzített edzések" description="A legutóbbi edzések gyors szerkesztéssel és visszakereshető gyakorlatlistával.">
        {sessions.length === 0 ? (
          <div className="placeholder-block">
            Az első edzésnek nem kell tökéletesnek lennie. Elég, ha elindítod, és holnap már lesz mihez visszanézni.
          </div>
        ) : (
          <div className="feature-timeline">
            {sessions.map((session) => (
              <article key={session.id} className="feature-timeline__item">
                <div className="feature-timeline__time">{formatEntryDate(session.sessionDate)}</div>
                <div>
                  <h3 className="feature-timeline__title">{session.title}</h3>
                  <p className="feature-timeline__detail">{session.note ?? "Nincs külön jegyzet."}</p>
                  <div className="feature-pill-row">
                    <span className="feature-pill feature-pill--good">{session.durationMinutes ? `${session.durationMinutes} perc` : "Idő nélkül"}</span>
                    <span className="feature-pill feature-pill--cool">{session.exercises.length} gyakorlat</span>
                    <span className="feature-pill feature-pill--ghost">{session.exercises.map((exercise) => exercise.exerciseName).join(", ")}</span>
                  </div>
                  <div className="workout-session-summary">
                    {session.exercises.slice(0, 3).map((exercise) => (
                      <div key={exercise.id} className="workout-session-summary__item">
                        <strong>{exercise.exerciseName}</strong>
                        <span>{exercise.sets.length > 0 ? buildSetSummary(exercise.sets[0]) || `${exercise.sets.length} szett` : "Nincs részletezett szett"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="feature-pill-row">
                    <button type="button" className="inline-action" onClick={() => startEdit(session.id)}>Szerkesztés</button>
                    <button type="button" className="inline-action inline-action--danger" onClick={() => deleteMutation.mutate(session.id)}>Törlés</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </FeatureSection>

      <datalist id="exercise-name-suggestions">
        {exerciseSuggestions.map((exerciseName) => (
          <option key={exerciseName} value={exerciseName} />
        ))}
      </datalist>
    </div>
  );
}
