import {
  hasSupabaseClient,
  requireSupabaseClient,
  shouldUseDemoFallback,
} from "@/lib/api/auth/client";
import { readJsonStorage } from "@/lib/api/demo/storage";

export type WorkoutPlanTemplateExerciseSet = Record<string, unknown>;

export type WorkoutPlanTemplateExercise = {
  id: string;
  templateId: string;
  exerciseName: string;
  sortOrder: number;
  targetSets: WorkoutPlanTemplateExerciseSet[];
  createdAt: string;
  updatedAt: string;
};

export type WorkoutPlanTemplate = {
  id: string;
  ownerUserId: string | null;
  name: string;
  description: string | null;
  isPublic: boolean;
  exercises: WorkoutPlanTemplateExercise[];
  createdAt: string;
  updatedAt: string;
};

type WorkoutPlanTemplateRow = {
  id: string;
  owner_user_id: string | null;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

type WorkoutPlanTemplateExerciseRow = {
  id: string;
  template_id: string;
  exercise_name: string;
  sort_order: number;
  target_sets: unknown;
  created_at: string;
  updated_at: string;
};

const workoutPlanTemplateSelect = `
  id,
  owner_user_id,
  name,
  description,
  is_public,
  created_at,
  updated_at
`;

const workoutPlanTemplateExerciseSelect = `
  id,
  template_id,
  exercise_name,
  sort_order,
  target_sets,
  created_at,
  updated_at
`;

const demoWorkoutPlanTemplatesStorageKey = "fit-track.demo.workout-plan-templates";
const demoSeedWorkoutPlanTemplates: WorkoutPlanTemplate[] = [
  {
    id: "8102d470-c964-4f50-9d06-0dab0633d5c4",
    ownerUserId: null,
    name: "Full Body Starter",
    description: "Three-day full body starter template focused on basic compound lifts.",
    isPublic: true,
    exercises: [
      {
        id: "81bdf500-5df5-4e4d-b29f-59ffcfbc3141",
        templateId: "8102d470-c964-4f50-9d06-0dab0633d5c4",
        exerciseName: "Goblet Squat",
        sortOrder: 0,
        targetSets: [
          { reps: "8-10", restSeconds: 90 },
          { reps: "8-10", restSeconds: 90 },
          { reps: "8-10", restSeconds: 90 },
        ],
        createdAt: "2026-03-19T09:30:00.000Z",
        updatedAt: "2026-03-19T09:30:00.000Z",
      },
      {
        id: "ec8d5974-a454-48a7-bc80-e09bf7062b7a",
        templateId: "8102d470-c964-4f50-9d06-0dab0633d5c4",
        exerciseName: "Dumbbell Bench Press",
        sortOrder: 1,
        targetSets: [
          { reps: "8-10", restSeconds: 90 },
          { reps: "8-10", restSeconds: 90 },
          { reps: "8-10", restSeconds: 90 },
        ],
        createdAt: "2026-03-19T09:30:00.000Z",
        updatedAt: "2026-03-19T09:30:00.000Z",
      },
      {
        id: "e34646aa-6600-4e8b-b62d-8fba1b92f218",
        templateId: "8102d470-c964-4f50-9d06-0dab0633d5c4",
        exerciseName: "Lat Pulldown",
        sortOrder: 2,
        targetSets: [
          { reps: "10-12", restSeconds: 75 },
          { reps: "10-12", restSeconds: 75 },
          { reps: "10-12", restSeconds: 75 },
        ],
        createdAt: "2026-03-19T09:30:00.000Z",
        updatedAt: "2026-03-19T09:30:00.000Z",
      },
    ],
    createdAt: "2026-03-19T09:30:00.000Z",
    updatedAt: "2026-03-19T09:30:00.000Z",
  },
  {
    id: "0de9da5a-c0fa-47cd-b14d-07e3586dbcb9",
    ownerUserId: null,
    name: "Upper Lower Split",
    description: "Four-day split template alternating upper and lower sessions.",
    isPublic: true,
    exercises: [
      {
        id: "9c047f4f-cddc-4297-8422-23d4385211f9",
        templateId: "0de9da5a-c0fa-47cd-b14d-07e3586dbcb9",
        exerciseName: "Back Squat",
        sortOrder: 0,
        targetSets: [
          { reps: "5", restSeconds: 120 },
          { reps: "5", restSeconds: 120 },
          { reps: "5", restSeconds: 120 },
        ],
        createdAt: "2026-03-19T09:30:00.000Z",
        updatedAt: "2026-03-19T09:30:00.000Z",
      },
      {
        id: "1d361659-d651-4164-8a15-82d9e44956ca",
        templateId: "0de9da5a-c0fa-47cd-b14d-07e3586dbcb9",
        exerciseName: "Romanian Deadlift",
        sortOrder: 1,
        targetSets: [
          { reps: "8", restSeconds: 120 },
          { reps: "8", restSeconds: 120 },
          { reps: "8", restSeconds: 120 },
        ],
        createdAt: "2026-03-19T09:30:00.000Z",
        updatedAt: "2026-03-19T09:30:00.000Z",
      },
      {
        id: "4b199c01-d118-4510-9c26-06cb906039e3",
        templateId: "0de9da5a-c0fa-47cd-b14d-07e3586dbcb9",
        exerciseName: "Pull-Up or Assisted Pull-Up",
        sortOrder: 2,
        targetSets: [
          { reps: "6-8", restSeconds: 90 },
          { reps: "6-8", restSeconds: 90 },
          { reps: "6-8", restSeconds: 90 },
        ],
        createdAt: "2026-03-19T09:30:00.000Z",
        updatedAt: "2026-03-19T09:30:00.000Z",
      },
    ],
    createdAt: "2026-03-19T09:30:00.000Z",
    updatedAt: "2026-03-19T09:30:00.000Z",
  },
];

function mapWorkoutPlanTemplateExerciseRow(
  row: WorkoutPlanTemplateExerciseRow
): WorkoutPlanTemplateExercise {
  return {
    id: row.id,
    templateId: row.template_id,
    exerciseName: row.exercise_name,
    sortOrder: row.sort_order,
    targetSets: Array.isArray(row.target_sets)
      ? (row.target_sets as WorkoutPlanTemplateExerciseSet[])
      : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWorkoutPlanTemplateRow(
  row: WorkoutPlanTemplateRow,
  exercisesByTemplateId: Map<string, WorkoutPlanTemplateExercise[]>
): WorkoutPlanTemplate {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    description: row.description,
    isPublic: row.is_public,
    exercises: exercisesByTemplateId.get(row.id) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function readDemoWorkoutPlanTemplates() {
  return readJsonStorage<WorkoutPlanTemplate[]>(
    demoWorkoutPlanTemplatesStorageKey,
    demoSeedWorkoutPlanTemplates
  );
}

function sortWorkoutPlanTemplates(templates: WorkoutPlanTemplate[]) {
  return [...templates].sort((left, right) => left.name.localeCompare(right.name));
}

async function fetchTemplateExercises(templateIds: string[]) {
  if (templateIds.length === 0) {
    return new Map<string, WorkoutPlanTemplateExercise[]>();
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("workout_plan_template_exercises")
    .select(workoutPlanTemplateExerciseSelect)
    .in("template_id", templateIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<WorkoutPlanTemplateExerciseRow[]>();

  if (error) {
    throw error;
  }

  const exercisesByTemplateId = new Map<string, WorkoutPlanTemplateExercise[]>();

  for (const row of data) {
    const mapped = mapWorkoutPlanTemplateExerciseRow(row);
    const existing = exercisesByTemplateId.get(mapped.templateId) ?? [];
    existing.push(mapped);
    exercisesByTemplateId.set(mapped.templateId, existing);
  }

  return exercisesByTemplateId;
}

export async function listWorkoutPlanTemplates() {
  if (!hasSupabaseClient()) {
    return sortWorkoutPlanTemplates(readDemoWorkoutPlanTemplates());
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("workout_plan_templates")
      .select(workoutPlanTemplateSelect)
      .order("name", { ascending: true })
      .returns<WorkoutPlanTemplateRow[]>();

    if (error) {
      throw error;
    }

    const exercisesByTemplateId = await fetchTemplateExercises(data.map((template) => template.id));

    return data.map((template) => mapWorkoutPlanTemplateRow(template, exercisesByTemplateId));
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return sortWorkoutPlanTemplates(readDemoWorkoutPlanTemplates());
    }

    throw error;
  }
}

export async function getWorkoutPlanTemplate(id: string) {
  const templates = await listWorkoutPlanTemplates();
  return templates.find((template) => template.id === id) ?? null;
}
