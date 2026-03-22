import { getCurrentUser } from "@/lib/api/auth";
import {
  hasSupabaseClient,
  requireSupabaseClient,
  shouldUseDemoFallback,
} from "@/lib/api/auth/client";
import { createDemoId, readJsonStorage, writeJsonStorage } from "@/lib/api/demo/storage";

export type WorkoutExerciseSet = Record<string, unknown>;

export type WorkoutExercise = {
  id: string;
  sessionId: string;
  exerciseName: string;
  sortOrder: number;
  sets: WorkoutExerciseSet[];
  createdAt: string;
  updatedAt: string;
};

export type WorkoutSession = {
  id: string;
  userId: string;
  sessionDate: string;
  title: string;
  durationMinutes: number | null;
  note: string | null;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkoutExerciseInput = {
  exerciseName: string;
  sortOrder?: number;
  sets?: WorkoutExerciseSet[];
};

export type UpdateWorkoutExerciseInput = {
  exerciseName?: string;
  sortOrder?: number;
  sets?: WorkoutExerciseSet[];
};

export type CreateWorkoutSessionInput = {
  sessionDate: string;
  title: string;
  durationMinutes?: number | null;
  note?: string | null;
  exercises?: CreateWorkoutExerciseInput[];
};

export type UpdateWorkoutSessionInput = {
  sessionDate?: string;
  title?: string;
  durationMinutes?: number | null;
  note?: string | null;
  exercises?: UpdateWorkoutExerciseInput[];
};

type WorkoutSessionRow = {
  id: string;
  user_id: string;
  session_date: string;
  title: string;
  duration_minutes: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type WorkoutExerciseRow = {
  id: string;
  session_id: string;
  exercise_name: string;
  sort_order: number;
  sets: unknown;
  created_at: string;
  updated_at: string;
};

const workoutSessionSelect = `
  id,
  user_id,
  session_date,
  title,
  duration_minutes,
  note,
  created_at,
  updated_at
`;

const workoutExerciseSelect = `
  id,
  session_id,
  exercise_name,
  sort_order,
  sets,
  created_at,
  updated_at
`;

const demoWorkoutSessionsStorageKey = "fit-track.demo.workout-sessions";

function mapWorkoutExerciseRow(row: WorkoutExerciseRow): WorkoutExercise {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseName: row.exercise_name,
    sortOrder: row.sort_order,
    sets: Array.isArray(row.sets) ? (row.sets as WorkoutExerciseSet[]) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWorkoutSessionRow(
  row: WorkoutSessionRow,
  exercisesBySessionId: Map<string, WorkoutExercise[]>
): WorkoutSession {
  return {
    id: row.id,
    userId: row.user_id,
    sessionDate: row.session_date,
    title: row.title,
    durationMinutes: row.duration_minutes,
    note: row.note,
    exercises: exercisesBySessionId.get(row.id) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCreateSessionInput(input: CreateWorkoutSessionInput, userId: string) {
  return {
    user_id: userId,
    session_date: input.sessionDate,
    title: input.title,
    duration_minutes: input.durationMinutes ?? null,
    note: input.note ?? null,
  };
}

function mapUpdateSessionInput(input: UpdateWorkoutSessionInput) {
  const payload: {
    session_date?: string;
    title?: string;
    duration_minutes?: number | null;
    note?: string | null;
  } = {};

  if (input.sessionDate !== undefined) {
    payload.session_date = input.sessionDate;
  }

  if (input.title !== undefined) {
    payload.title = input.title;
  }

  if (input.durationMinutes !== undefined) {
    payload.duration_minutes = input.durationMinutes;
  }

  if (input.note !== undefined) {
    payload.note = input.note;
  }

  return payload;
}

function normalizeExerciseSets(sets: WorkoutExerciseSet[] | undefined) {
  return sets ?? [];
}

function mapExerciseInput(
  sessionId: string,
  exercises: Array<CreateWorkoutExerciseInput | UpdateWorkoutExerciseInput>
) {
  return exercises.map((exercise, index) => ({
    session_id: sessionId,
    exercise_name: exercise.exerciseName ?? "Untitled exercise",
    sort_order: exercise.sortOrder ?? index,
    sets: normalizeExerciseSets(exercise.sets),
  }));
}

async function requireAuthenticatedUserId() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Bejelentkezés szükséges az adatok kezeléséhez.");
  }

  return user.id;
}

function readDemoWorkoutSessions() {
  return readJsonStorage<WorkoutSession[]>(demoWorkoutSessionsStorageKey, []);
}

function writeDemoWorkoutSessions(sessions: WorkoutSession[]) {
  writeJsonStorage(demoWorkoutSessionsStorageKey, sessions);
}

function sortWorkoutSessions(sessions: WorkoutSession[]) {
  return [...sessions].sort((left, right) => {
    const dateCompare = right.sessionDate.localeCompare(left.sessionDate);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function listDemoWorkoutSessions(userId: string) {
  return sortWorkoutSessions(readDemoWorkoutSessions().filter((session) => session.userId === userId));
}

function createDemoExercises(
  sessionId: string,
  exercises: CreateWorkoutExerciseInput[] | UpdateWorkoutExerciseInput[] | undefined,
  timestamp: string
) {
  return (exercises ?? []).map((exercise, index) => ({
    id: createDemoId("workout-exercise"),
    sessionId,
    exerciseName: exercise.exerciseName ?? "Untitled exercise",
    sortOrder: exercise.sortOrder ?? index,
    sets: normalizeExerciseSets(exercise.sets),
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

function createDemoWorkoutSession(userId: string, input: CreateWorkoutSessionInput) {
  const now = new Date().toISOString();
  const sessionId = createDemoId("workout-session");
  const session: WorkoutSession = {
    id: sessionId,
    userId,
    sessionDate: input.sessionDate,
    title: input.title,
    durationMinutes: input.durationMinutes ?? null,
    note: input.note ?? null,
    exercises: createDemoExercises(sessionId, input.exercises, now),
    createdAt: now,
    updatedAt: now,
  };

  writeDemoWorkoutSessions([...readDemoWorkoutSessions(), session]);

  return session;
}

function updateDemoWorkoutSession(userId: string, id: string, input: UpdateWorkoutSessionInput) {
  let updatedSession: WorkoutSession | null = null;
  const nextSessions = readDemoWorkoutSessions().map((session) => {
    if (session.id !== id || session.userId !== userId) {
      return session;
    }

    const now = new Date().toISOString();
    const exercises =
      input.exercises !== undefined
        ? createDemoExercises(session.id, input.exercises, now)
        : session.exercises;

    updatedSession = {
      ...session,
      sessionDate: input.sessionDate ?? session.sessionDate,
      title: input.title ?? session.title,
      durationMinutes:
        input.durationMinutes !== undefined ? input.durationMinutes : session.durationMinutes,
      note: input.note !== undefined ? input.note : session.note,
      exercises,
      updatedAt: now,
    };

    return updatedSession;
  });

  if (!updatedSession) {
    throw new Error("Workout session not found.");
  }

  writeDemoWorkoutSessions(nextSessions);

  return updatedSession;
}

function deleteDemoWorkoutSession(userId: string, id: string) {
  writeDemoWorkoutSessions(
    readDemoWorkoutSessions().filter((session) => !(session.id === id && session.userId === userId))
  );
}

async function fetchWorkoutExercises(sessionIds: string[]) {
  if (sessionIds.length === 0) {
    return new Map<string, WorkoutExercise[]>();
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("workout_exercises")
    .select(workoutExerciseSelect)
    .in("session_id", sessionIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<WorkoutExerciseRow[]>();

  if (error) {
    throw error;
  }

  const exercisesBySessionId = new Map<string, WorkoutExercise[]>();

  for (const row of data) {
    const mapped = mapWorkoutExerciseRow(row);
    const existing = exercisesBySessionId.get(mapped.sessionId) ?? [];
    existing.push(mapped);
    exercisesBySessionId.set(mapped.sessionId, existing);
  }

  return exercisesBySessionId;
}

async function insertWorkoutExercises(
  sessionId: string,
  exercises: CreateWorkoutExerciseInput[] | UpdateWorkoutExerciseInput[] | undefined
) {
  if (!exercises || exercises.length === 0) {
    return [];
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("workout_exercises")
    .insert(mapExerciseInput(sessionId, exercises))
    .select(workoutExerciseSelect)
    .order("sort_order", { ascending: true })
    .returns<WorkoutExerciseRow[]>();

  if (error) {
    throw error;
  }

  return data.map(mapWorkoutExerciseRow);
}

export async function listWorkoutSessions() {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    return listDemoWorkoutSessions(userId);
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("workout_sessions")
      .select(workoutSessionSelect)
      .order("session_date", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<WorkoutSessionRow[]>();

    if (error) {
      throw error;
    }

    const exercisesBySessionId = await fetchWorkoutExercises(data.map((session) => session.id));

    return data.map((session) => mapWorkoutSessionRow(session, exercisesBySessionId));
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return listDemoWorkoutSessions(userId);
    }

    throw error;
  }
}

export async function createWorkoutSession(input: CreateWorkoutSessionInput) {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    return createDemoWorkoutSession(userId, input);
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("workout_sessions")
      .insert(mapCreateSessionInput(input, userId))
      .select(workoutSessionSelect)
      .single<WorkoutSessionRow>();

    if (error) {
      throw error;
    }

    const exercises = await insertWorkoutExercises(data.id, input.exercises);

    return {
      ...mapWorkoutSessionRow(data, new Map()),
      exercises,
    };
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return createDemoWorkoutSession(userId, input);
    }

    throw error;
  }
}

export async function updateWorkoutSession(id: string, input: UpdateWorkoutSessionInput) {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    return updateDemoWorkoutSession(userId, id, input);
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("workout_sessions")
      .update(mapUpdateSessionInput(input))
      .eq("id", id)
      .select(workoutSessionSelect)
      .single<WorkoutSessionRow>();

    if (error) {
      throw error;
    }

    let exercisesBySessionId = await fetchWorkoutExercises([id]);

    if (input.exercises !== undefined) {
      const deleteResult = await client.from("workout_exercises").delete().eq("session_id", id);

      if (deleteResult.error) {
        throw deleteResult.error;
      }

      const nextExercises = await insertWorkoutExercises(id, input.exercises);
      exercisesBySessionId = new Map([[id, nextExercises]]);
    }

    return mapWorkoutSessionRow(data, exercisesBySessionId);
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return updateDemoWorkoutSession(userId, id, input);
    }

    throw error;
  }
}

export async function deleteWorkoutSession(id: string) {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    deleteDemoWorkoutSession(userId, id);
    return;
  }

  try {
    const client = requireSupabaseClient();
    const { error } = await client.from("workout_sessions").delete().eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      deleteDemoWorkoutSession(userId, id);
      return;
    }

    throw error;
  }
}
