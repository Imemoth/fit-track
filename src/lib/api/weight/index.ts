import { getCurrentUser } from "@/lib/api/auth";
import {
  hasSupabaseClient,
  requireSupabaseClient,
  shouldUseDemoFallback,
} from "@/lib/api/auth/client";
import { createDemoId, readJsonStorage, writeJsonStorage } from "@/lib/api/demo/storage";

export type WeightEntry = {
  id: string;
  userId: string;
  entryDate: string;
  weightKg: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateWeightEntryInput = {
  entryDate: string;
  weightKg: number;
  note?: string | null;
};

export type UpdateWeightEntryInput = {
  entryDate?: string;
  weightKg?: number;
  note?: string | null;
};

type WeightEntryRow = {
  id: string;
  user_id: string;
  entry_date: string;
  weight_kg: number | string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

const weightEntrySelect = `
  id,
  user_id,
  entry_date,
  weight_kg,
  note,
  created_at,
  updated_at
`;

const demoWeightEntriesStorageKey = "fit-track.demo.weight-entries";

function mapWeightEntryRow(row: WeightEntryRow): WeightEntry {
  return {
    id: row.id,
    userId: row.user_id,
    entryDate: row.entry_date,
    weightKg: typeof row.weight_kg === "number" ? row.weight_kg : Number(row.weight_kg),
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCreateInput(input: CreateWeightEntryInput, userId: string) {
  return {
    user_id: userId,
    entry_date: input.entryDate,
    weight_kg: input.weightKg,
    note: input.note ?? null,
  };
}

function mapUpdateInput(input: UpdateWeightEntryInput) {
  const payload: {
    entry_date?: string;
    weight_kg?: number;
    note?: string | null;
  } = {};

  if (input.entryDate !== undefined) {
    payload.entry_date = input.entryDate;
  }

  if (input.weightKg !== undefined) {
    payload.weight_kg = input.weightKg;
  }

  if (input.note !== undefined) {
    payload.note = input.note;
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

function readDemoWeightEntries() {
  return readJsonStorage<WeightEntry[]>(demoWeightEntriesStorageKey, []);
}

function writeDemoWeightEntries(entries: WeightEntry[]) {
  writeJsonStorage(demoWeightEntriesStorageKey, entries);
}

function sortWeightEntries(entries: WeightEntry[]) {
  return [...entries].sort((left, right) => {
    const dateCompare = right.entryDate.localeCompare(left.entryDate);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function listDemoWeightEntries(userId: string) {
  return sortWeightEntries(readDemoWeightEntries().filter((entry) => entry.userId === userId));
}

function createDemoWeightEntry(userId: string, input: CreateWeightEntryInput) {
  const now = new Date().toISOString();
  const entry: WeightEntry = {
    id: createDemoId("weight"),
    userId,
    entryDate: input.entryDate,
    weightKg: input.weightKg,
    note: input.note ?? null,
    createdAt: now,
    updatedAt: now,
  };

  writeDemoWeightEntries([...readDemoWeightEntries(), entry]);

  return entry;
}

function updateDemoWeightEntry(userId: string, id: string, input: UpdateWeightEntryInput) {
  let updatedEntry: WeightEntry | null = null;
  const nextEntries = readDemoWeightEntries().map((entry) => {
    if (entry.id !== id || entry.userId !== userId) {
      return entry;
    }

    updatedEntry = {
      ...entry,
      entryDate: input.entryDate ?? entry.entryDate,
      weightKg: input.weightKg ?? entry.weightKg,
      note: input.note !== undefined ? input.note : entry.note,
      updatedAt: new Date().toISOString(),
    };

    return updatedEntry;
  });

  if (!updatedEntry) {
    throw new Error("Weight entry not found.");
  }

  writeDemoWeightEntries(nextEntries);

  return updatedEntry;
}

function deleteDemoWeightEntry(userId: string, id: string) {
  const existingEntries = readDemoWeightEntries();
  writeDemoWeightEntries(
    existingEntries.filter((entry) => !(entry.id === id && entry.userId === userId))
  );
}

export async function listWeightEntries() {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    return listDemoWeightEntries(userId);
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("weight_entries")
      .select(weightEntrySelect)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<WeightEntryRow[]>();

    if (error) {
      throw error;
    }

    return data.map(mapWeightEntryRow);
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return listDemoWeightEntries(userId);
    }

    throw error;
  }
}

export async function createWeightEntry(input: CreateWeightEntryInput) {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    return createDemoWeightEntry(userId, input);
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("weight_entries")
      .insert(mapCreateInput(input, userId))
      .select(weightEntrySelect)
      .single<WeightEntryRow>();

    if (error) {
      throw error;
    }

    return mapWeightEntryRow(data);
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return createDemoWeightEntry(userId, input);
    }

    throw error;
  }
}

export async function updateWeightEntry(id: string, input: UpdateWeightEntryInput) {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    return updateDemoWeightEntry(userId, id, input);
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("weight_entries")
      .update(mapUpdateInput(input))
      .eq("id", id)
      .select(weightEntrySelect)
      .single<WeightEntryRow>();

    if (error) {
      throw error;
    }

    return mapWeightEntryRow(data);
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return updateDemoWeightEntry(userId, id, input);
    }

    throw error;
  }
}

export async function deleteWeightEntry(id: string) {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    deleteDemoWeightEntry(userId, id);
    return;
  }

  try {
    const client = requireSupabaseClient();
    const { error } = await client.from("weight_entries").delete().eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      deleteDemoWeightEntry(userId, id);
      return;
    }

    throw error;
  }
}
