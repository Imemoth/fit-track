import {
  createMeasurementEntry,
  createNutritionEntry,
  createWeightEntry,
  createWorkoutSession,
  deleteMeasurementEntry,
  deleteNutritionEntry,
  deleteWeightEntry,
  deleteWorkoutSession,
  listMeasurementEntries,
  listNutritionEntries,
  listWeightEntries,
  listWorkoutSessions,
  type CreateMeasurementEntryInput,
  type CreateNutritionEntryInput,
  type CreateWeightEntryInput,
  type CreateWorkoutSessionInput,
  type MeasurementEntry,
  type NutritionEntry,
  type WeightEntry,
  type WorkoutSession,
} from "@/lib/api";
import type { ExportModuleId } from "@/features/dashboard/export-utils";

export type ImportPayload = {
  exportedAt?: string;
  version?: number;
  modules?: ExportModuleId[];
  weightEntries?: WeightEntry[];
  nutritionEntries?: NutritionEntry[];
  workoutSessions?: WorkoutSession[];
  measurementEntries?: MeasurementEntry[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isExportModuleId(value: unknown): value is ExportModuleId {
  return value === "weight" || value === "nutrition" || value === "workouts" || value === "measurements";
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function getModules(payload: ImportPayload): ExportModuleId[] {
  const declaredModules = Array.isArray(payload.modules)
    ? payload.modules.filter(isExportModuleId)
    : [];

  if (declaredModules.length > 0) {
    return declaredModules;
  }

  const inferredModules: ExportModuleId[] = [];

  if (Array.isArray(payload.weightEntries)) inferredModules.push("weight");
  if (Array.isArray(payload.nutritionEntries)) inferredModules.push("nutrition");
  if (Array.isArray(payload.workoutSessions)) inferredModules.push("workouts");
  if (Array.isArray(payload.measurementEntries)) inferredModules.push("measurements");

  return inferredModules;
}

export async function parseImportFile(file: File) {
  const raw = await file.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("A kiválasztott fájl nem érvényes JSON export.");
  }

  if (!isObject(parsed)) {
    throw new Error("A kiválasztott export formátuma hibás.");
  }

  const payload = parsed as ImportPayload;
  const modules = getModules(payload);

  if (modules.length === 0) {
    throw new Error("Az exportfájl nem tartalmaz importálható modult.");
  }

  return {
    payload,
    modules,
  };
}

function mapWeightEntries(entries: WeightEntry[]): CreateWeightEntryInput[] {
  return entries.map((entry) => ({
    entryDate: entry.entryDate,
    weightKg: entry.weightKg,
    note: entry.note,
  }));
}

function mapNutritionEntries(entries: NutritionEntry[]): CreateNutritionEntryInput[] {
  return entries.map((entry) => ({
    entryDate: entry.entryDate,
    mealType: entry.mealType,
    itemName: entry.itemName,
    calories: entry.calories,
    proteinG: entry.proteinG,
    carbsG: entry.carbsG,
    fatG: entry.fatG,
  }));
}

function mapWorkoutSessions(entries: WorkoutSession[]): CreateWorkoutSessionInput[] {
  return entries.map((session) => ({
    sessionDate: session.sessionDate,
    title: session.title,
    durationMinutes: session.durationMinutes,
    note: session.note,
    exercises: session.exercises.map((exercise, index) => ({
      exerciseName: exercise.exerciseName,
      sortOrder: exercise.sortOrder ?? index,
      sets: Array.isArray(exercise.sets) ? exercise.sets : [],
    })),
  }));
}

function mapMeasurementEntries(entries: MeasurementEntry[]): CreateMeasurementEntryInput[] {
  return entries.map((entry) => ({
    entryDate: entry.entryDate,
    waistCm: entry.waistCm,
    hipsCm: entry.hipsCm,
    chestCm: entry.chestCm,
    armCm: entry.armCm,
    thighCm: entry.thighCm,
    neckCm: entry.neckCm,
  }));
}

async function clearWeightEntries() {
  const entries = await listWeightEntries();
  for (const entry of entries) {
    await deleteWeightEntry(entry.id);
  }
}

async function clearNutritionEntries() {
  const entries = await listNutritionEntries();
  for (const entry of entries) {
    await deleteNutritionEntry(entry.id);
  }
}

async function clearWorkoutSessions() {
  const entries = await listWorkoutSessions();
  for (const entry of entries) {
    await deleteWorkoutSession(entry.id);
  }
}

async function clearMeasurementEntries() {
  const entries = await listMeasurementEntries();
  for (const entry of entries) {
    await deleteMeasurementEntry(entry.id);
  }
}

async function clearModules(modules: ExportModuleId[]) {
  for (const moduleId of modules) {
    if (moduleId === "weight") {
      await clearWeightEntries();
    }

    if (moduleId === "nutrition") {
      await clearNutritionEntries();
    }

    if (moduleId === "workouts") {
      await clearWorkoutSessions();
    }

    if (moduleId === "measurements") {
      await clearMeasurementEntries();
    }
  }
}

export async function restorePayload(payload: ImportPayload, modules: ExportModuleId[]) {
  const weightEntries = mapWeightEntries(asArray<WeightEntry>(payload.weightEntries));
  const nutritionEntries = mapNutritionEntries(asArray<NutritionEntry>(payload.nutritionEntries));
  const workoutSessions = mapWorkoutSessions(asArray<WorkoutSession>(payload.workoutSessions));
  const measurementEntries = mapMeasurementEntries(
    asArray<MeasurementEntry>(payload.measurementEntries)
  );

  await clearModules(modules);

  for (const entry of weightEntries) {
    await createWeightEntry(entry);
  }

  for (const entry of nutritionEntries) {
    await createNutritionEntry(entry);
  }

  for (const session of workoutSessions) {
    await createWorkoutSession(session);
  }

  for (const entry of measurementEntries) {
    await createMeasurementEntry(entry);
  }

  return {
    weight: weightEntries.length,
    nutrition: nutritionEntries.length,
    workouts: workoutSessions.length,
    measurements: measurementEntries.length,
  };
}
