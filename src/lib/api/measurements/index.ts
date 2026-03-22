import { getCurrentUser } from "@/lib/api/auth";
import {
  hasSupabaseClient,
  requireSupabaseClient,
  shouldUseDemoFallback,
} from "@/lib/api/auth/client";
import { createDemoId, readJsonStorage, writeJsonStorage } from "@/lib/api/demo/storage";

export type MeasurementEntry = {
  id: string;
  userId: string;
  entryDate: string;
  waistCm: number | null;
  hipsCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  neckCm: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateMeasurementEntryInput = {
  entryDate: string;
  waistCm?: number | null;
  hipsCm?: number | null;
  chestCm?: number | null;
  armCm?: number | null;
  thighCm?: number | null;
  neckCm?: number | null;
};

export type UpdateMeasurementEntryInput = {
  entryDate?: string;
  waistCm?: number | null;
  hipsCm?: number | null;
  chestCm?: number | null;
  armCm?: number | null;
  thighCm?: number | null;
  neckCm?: number | null;
};

type MeasurementEntryRow = {
  id: string;
  user_id: string;
  entry_date: string;
  waist_cm: number | string | null;
  hips_cm: number | string | null;
  chest_cm: number | string | null;
  arm_cm: number | string | null;
  thigh_cm: number | string | null;
  neck_cm: number | string | null;
  created_at: string;
  updated_at: string;
};

const measurementEntrySelect = `
  id,
  user_id,
  entry_date,
  waist_cm,
  hips_cm,
  chest_cm,
  arm_cm,
  thigh_cm,
  neck_cm,
  created_at,
  updated_at
`;

const demoMeasurementEntriesStorageKey = "fit-track.demo.measurement-entries";

function toNullableNumber(value: number | string | null) {
  if (value === null) {
    return null;
  }

  return typeof value === "number" ? value : Number(value);
}

function mapMeasurementEntryRow(row: MeasurementEntryRow): MeasurementEntry {
  return {
    id: row.id,
    userId: row.user_id,
    entryDate: row.entry_date,
    waistCm: toNullableNumber(row.waist_cm),
    hipsCm: toNullableNumber(row.hips_cm),
    chestCm: toNullableNumber(row.chest_cm),
    armCm: toNullableNumber(row.arm_cm),
    thighCm: toNullableNumber(row.thigh_cm),
    neckCm: toNullableNumber(row.neck_cm),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCreateInput(input: CreateMeasurementEntryInput, userId: string) {
  return {
    user_id: userId,
    entry_date: input.entryDate,
    waist_cm: input.waistCm ?? null,
    hips_cm: input.hipsCm ?? null,
    chest_cm: input.chestCm ?? null,
    arm_cm: input.armCm ?? null,
    thigh_cm: input.thighCm ?? null,
    neck_cm: input.neckCm ?? null,
  };
}

function mapUpdateInput(input: UpdateMeasurementEntryInput) {
  const payload: {
    entry_date?: string;
    waist_cm?: number | null;
    hips_cm?: number | null;
    chest_cm?: number | null;
    arm_cm?: number | null;
    thigh_cm?: number | null;
    neck_cm?: number | null;
  } = {};

  if (input.entryDate !== undefined) {
    payload.entry_date = input.entryDate;
  }

  if (input.waistCm !== undefined) {
    payload.waist_cm = input.waistCm;
  }

  if (input.hipsCm !== undefined) {
    payload.hips_cm = input.hipsCm;
  }

  if (input.chestCm !== undefined) {
    payload.chest_cm = input.chestCm;
  }

  if (input.armCm !== undefined) {
    payload.arm_cm = input.armCm;
  }

  if (input.thighCm !== undefined) {
    payload.thigh_cm = input.thighCm;
  }

  if (input.neckCm !== undefined) {
    payload.neck_cm = input.neckCm;
  }

  return payload;
}

async function requireAuthenticatedUserId() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Bejelentkezés szükséges az adatok kezeléséhez.");
  }

  return user.id;
}

function readDemoMeasurementEntries() {
  return readJsonStorage<MeasurementEntry[]>(demoMeasurementEntriesStorageKey, []);
}

function writeDemoMeasurementEntries(entries: MeasurementEntry[]) {
  writeJsonStorage(demoMeasurementEntriesStorageKey, entries);
}

function sortMeasurementEntries(entries: MeasurementEntry[]) {
  return [...entries].sort((left, right) => {
    const dateCompare = right.entryDate.localeCompare(left.entryDate);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function listDemoMeasurementEntries(userId: string) {
  return sortMeasurementEntries(
    readDemoMeasurementEntries().filter((entry) => entry.userId === userId)
  );
}

function createDemoMeasurementEntry(userId: string, input: CreateMeasurementEntryInput) {
  const now = new Date().toISOString();
  const entry: MeasurementEntry = {
    id: createDemoId("measurement"),
    userId,
    entryDate: input.entryDate,
    waistCm: input.waistCm ?? null,
    hipsCm: input.hipsCm ?? null,
    chestCm: input.chestCm ?? null,
    armCm: input.armCm ?? null,
    thighCm: input.thighCm ?? null,
    neckCm: input.neckCm ?? null,
    createdAt: now,
    updatedAt: now,
  };

  writeDemoMeasurementEntries([...readDemoMeasurementEntries(), entry]);

  return entry;
}

function updateDemoMeasurementEntry(
  userId: string,
  id: string,
  input: UpdateMeasurementEntryInput
) {
  let updatedEntry: MeasurementEntry | null = null;
  const nextEntries = readDemoMeasurementEntries().map((entry) => {
    if (entry.id !== id || entry.userId !== userId) {
      return entry;
    }

    updatedEntry = {
      ...entry,
      entryDate: input.entryDate ?? entry.entryDate,
      waistCm: input.waistCm !== undefined ? input.waistCm : entry.waistCm,
      hipsCm: input.hipsCm !== undefined ? input.hipsCm : entry.hipsCm,
      chestCm: input.chestCm !== undefined ? input.chestCm : entry.chestCm,
      armCm: input.armCm !== undefined ? input.armCm : entry.armCm,
      thighCm: input.thighCm !== undefined ? input.thighCm : entry.thighCm,
      neckCm: input.neckCm !== undefined ? input.neckCm : entry.neckCm,
      updatedAt: new Date().toISOString(),
    };

    return updatedEntry;
  });

  if (!updatedEntry) {
    throw new Error("Measurement entry not found.");
  }

  writeDemoMeasurementEntries(nextEntries);

  return updatedEntry;
}

function deleteDemoMeasurementEntry(userId: string, id: string) {
  writeDemoMeasurementEntries(
    readDemoMeasurementEntries().filter((entry) => !(entry.id === id && entry.userId === userId))
  );
}

export async function listMeasurementEntries() {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    return listDemoMeasurementEntries(userId);
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("body_measurements")
      .select(measurementEntrySelect)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<MeasurementEntryRow[]>();

    if (error) {
      throw error;
    }

    return data.map(mapMeasurementEntryRow);
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return listDemoMeasurementEntries(userId);
    }

    throw error;
  }
}

export async function createMeasurementEntry(input: CreateMeasurementEntryInput) {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    return createDemoMeasurementEntry(userId, input);
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("body_measurements")
      .insert(mapCreateInput(input, userId))
      .select(measurementEntrySelect)
      .single<MeasurementEntryRow>();

    if (error) {
      throw error;
    }

    return mapMeasurementEntryRow(data);
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return createDemoMeasurementEntry(userId, input);
    }

    throw error;
  }
}

export async function updateMeasurementEntry(id: string, input: UpdateMeasurementEntryInput) {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    return updateDemoMeasurementEntry(userId, id, input);
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("body_measurements")
      .update(mapUpdateInput(input))
      .eq("id", id)
      .select(measurementEntrySelect)
      .single<MeasurementEntryRow>();

    if (error) {
      throw error;
    }

    return mapMeasurementEntryRow(data);
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return updateDemoMeasurementEntry(userId, id, input);
    }

    throw error;
  }
}

export async function deleteMeasurementEntry(id: string) {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    deleteDemoMeasurementEntry(userId, id);
    return;
  }

  try {
    const client = requireSupabaseClient();
    const { error } = await client.from("body_measurements").delete().eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      deleteDemoMeasurementEntry(userId, id);
      return;
    }

    throw error;
  }
}
