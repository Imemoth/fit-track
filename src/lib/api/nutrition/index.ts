import { getCurrentUser } from "@/lib/api/auth";
import {
  hasSupabaseClient,
  requireSupabaseClient,
  shouldUseDemoFallback,
} from "@/lib/api/auth/client";
import { createDemoId, readJsonStorage, writeJsonStorage } from "@/lib/api/demo/storage";

export type NutritionEntry = {
  id: string;
  userId: string;
  entryDate: string;
  mealType: string;
  itemName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateNutritionEntryInput = {
  entryDate: string;
  mealType: string;
  itemName: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
};

export type UpdateNutritionEntryInput = {
  entryDate?: string;
  mealType?: string;
  itemName?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
};

type NutritionEntryRow = {
  id: string;
  user_id: string;
  entry_date: string;
  meal_type: string;
  item_name: string;
  calories: number | string;
  protein_g: number | string;
  carbs_g: number | string;
  fat_g: number | string;
  created_at: string;
  updated_at: string;
};

const nutritionEntrySelect = `
  id,
  user_id,
  entry_date,
  meal_type,
  item_name,
  calories,
  protein_g,
  carbs_g,
  fat_g,
  created_at,
  updated_at
`;

const demoNutritionEntriesStorageKey = "fit-track.demo.nutrition-entries";

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function mapNutritionEntryRow(row: NutritionEntryRow): NutritionEntry {
  return {
    id: row.id,
    userId: row.user_id,
    entryDate: row.entry_date,
    mealType: row.meal_type,
    itemName: row.item_name,
    calories: toNumber(row.calories),
    proteinG: toNumber(row.protein_g),
    carbsG: toNumber(row.carbs_g),
    fatG: toNumber(row.fat_g),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCreateInput(input: CreateNutritionEntryInput, userId: string) {
  return {
    user_id: userId,
    entry_date: input.entryDate,
    meal_type: input.mealType,
    item_name: input.itemName,
    calories: input.calories,
    protein_g: input.proteinG ?? 0,
    carbs_g: input.carbsG ?? 0,
    fat_g: input.fatG ?? 0,
  };
}

function mapUpdateInput(input: UpdateNutritionEntryInput) {
  const payload: {
    entry_date?: string;
    meal_type?: string;
    item_name?: string;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
  } = {};

  if (input.entryDate !== undefined) {
    payload.entry_date = input.entryDate;
  }

  if (input.mealType !== undefined) {
    payload.meal_type = input.mealType;
  }

  if (input.itemName !== undefined) {
    payload.item_name = input.itemName;
  }

  if (input.calories !== undefined) {
    payload.calories = input.calories;
  }

  if (input.proteinG !== undefined) {
    payload.protein_g = input.proteinG;
  }

  if (input.carbsG !== undefined) {
    payload.carbs_g = input.carbsG;
  }

  if (input.fatG !== undefined) {
    payload.fat_g = input.fatG;
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

function readDemoNutritionEntries() {
  return readJsonStorage<NutritionEntry[]>(demoNutritionEntriesStorageKey, []);
}

function writeDemoNutritionEntries(entries: NutritionEntry[]) {
  writeJsonStorage(demoNutritionEntriesStorageKey, entries);
}

function sortNutritionEntries(entries: NutritionEntry[]) {
  return [...entries].sort((left, right) => {
    const dateCompare = right.entryDate.localeCompare(left.entryDate);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function listDemoNutritionEntries(userId: string) {
  return sortNutritionEntries(readDemoNutritionEntries().filter((entry) => entry.userId === userId));
}

function createDemoNutritionEntry(userId: string, input: CreateNutritionEntryInput) {
  const now = new Date().toISOString();
  const entry: NutritionEntry = {
    id: createDemoId("nutrition"),
    userId,
    entryDate: input.entryDate,
    mealType: input.mealType,
    itemName: input.itemName,
    calories: input.calories,
    proteinG: input.proteinG ?? 0,
    carbsG: input.carbsG ?? 0,
    fatG: input.fatG ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  writeDemoNutritionEntries([...readDemoNutritionEntries(), entry]);

  return entry;
}

function updateDemoNutritionEntry(userId: string, id: string, input: UpdateNutritionEntryInput) {
  let updatedEntry: NutritionEntry | null = null;
  const nextEntries = readDemoNutritionEntries().map((entry) => {
    if (entry.id !== id || entry.userId !== userId) {
      return entry;
    }

    updatedEntry = {
      ...entry,
      entryDate: input.entryDate ?? entry.entryDate,
      mealType: input.mealType ?? entry.mealType,
      itemName: input.itemName ?? entry.itemName,
      calories: input.calories ?? entry.calories,
      proteinG: input.proteinG ?? entry.proteinG,
      carbsG: input.carbsG ?? entry.carbsG,
      fatG: input.fatG ?? entry.fatG,
      updatedAt: new Date().toISOString(),
    };

    return updatedEntry;
  });

  if (!updatedEntry) {
    throw new Error("Nutrition entry not found.");
  }

  writeDemoNutritionEntries(nextEntries);

  return updatedEntry;
}

function deleteDemoNutritionEntry(userId: string, id: string) {
  const existingEntries = readDemoNutritionEntries();
  writeDemoNutritionEntries(
    existingEntries.filter((entry) => !(entry.id === id && entry.userId === userId))
  );
}

export async function listNutritionEntries() {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    return listDemoNutritionEntries(userId);
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("nutrition_entries")
      .select(nutritionEntrySelect)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<NutritionEntryRow[]>();

    if (error) {
      throw error;
    }

    return data.map(mapNutritionEntryRow);
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return listDemoNutritionEntries(userId);
    }

    throw error;
  }
}

export async function createNutritionEntry(input: CreateNutritionEntryInput) {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    return createDemoNutritionEntry(userId, input);
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("nutrition_entries")
      .insert(mapCreateInput(input, userId))
      .select(nutritionEntrySelect)
      .single<NutritionEntryRow>();

    if (error) {
      throw error;
    }

    return mapNutritionEntryRow(data);
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return createDemoNutritionEntry(userId, input);
    }

    throw error;
  }
}

export async function updateNutritionEntry(id: string, input: UpdateNutritionEntryInput) {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    return updateDemoNutritionEntry(userId, id, input);
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("nutrition_entries")
      .update(mapUpdateInput(input))
      .eq("id", id)
      .select(nutritionEntrySelect)
      .single<NutritionEntryRow>();

    if (error) {
      throw error;
    }

    return mapNutritionEntryRow(data);
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return updateDemoNutritionEntry(userId, id, input);
    }

    throw error;
  }
}

export async function deleteNutritionEntry(id: string) {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    deleteDemoNutritionEntry(userId, id);
    return;
  }

  try {
    const client = requireSupabaseClient();
    const { error } = await client.from("nutrition_entries").delete().eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      deleteDemoNutritionEntry(userId, id);
      return;
    }

    throw error;
  }
}
