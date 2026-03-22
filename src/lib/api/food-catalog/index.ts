import { getCurrentUser } from "@/lib/api/auth";
import {
  hasSupabaseClient,
  requireSupabaseClient,
  shouldUseDemoFallback,
} from "@/lib/api/auth/client";
import { readJsonStorage } from "@/lib/api/demo/storage";

export type FoodCatalogItem = {
  id: string;
  ownerUserId: string | null;
  name: string;
  brand: string | null;
  servingSizeText: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: string;
  externalRef: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NutritionEntryFoodLink = {
  id: string;
  nutritionEntryId: string;
  foodCatalogItemId: string;
  quantity: number;
  unitLabel: string | null;
  createdAt: string;
  updatedAt: string;
};

type FoodCatalogItemRow = {
  id: string;
  owner_user_id: string | null;
  name: string;
  brand: string | null;
  serving_size_text: string | null;
  calories: number;
  protein_g: number | string;
  carbs_g: number | string;
  fat_g: number | string;
  source: string;
  external_ref: string | null;
  created_at: string;
  updated_at: string;
};

type NutritionEntryFoodLinkRow = {
  id: string;
  nutrition_entry_id: string;
  food_catalog_item_id: string;
  quantity: number | string;
  unit_label: string | null;
  created_at: string;
  updated_at: string;
};

const foodCatalogItemSelect = `
  id,
  owner_user_id,
  name,
  brand,
  serving_size_text,
  calories,
  protein_g,
  carbs_g,
  fat_g,
  source,
  external_ref,
  created_at,
  updated_at
`;

const nutritionEntryFoodLinkSelect = `
  id,
  nutrition_entry_id,
  food_catalog_item_id,
  quantity,
  unit_label,
  created_at,
  updated_at
`;

const demoFoodCatalogItemsStorageKey = "fit-track.demo.food-catalog-items";
const demoNutritionEntryFoodLinksStorageKey = "fit-track.demo.nutrition-entry-food-links";
const demoSeedFoodCatalogItems: FoodCatalogItem[] = [
  {
    id: "4f54db18-d831-49f3-bc85-6a147144f6fa",
    ownerUserId: null,
    name: "Chicken Breast",
    brand: "Generic",
    servingSizeText: "100 g",
    calories: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
    source: "seed",
    externalRef: "seed:chicken-breast-100g",
    createdAt: "2026-03-19T09:30:00.000Z",
    updatedAt: "2026-03-19T09:30:00.000Z",
  },
  {
    id: "ff8fb278-82b1-4d59-a92d-e042cfcc2b35",
    ownerUserId: null,
    name: "Cooked Rice",
    brand: "Generic",
    servingSizeText: "100 g",
    calories: 130,
    proteinG: 2.7,
    carbsG: 28.2,
    fatG: 0.3,
    source: "seed",
    externalRef: "seed:cooked-rice-100g",
    createdAt: "2026-03-19T09:30:00.000Z",
    updatedAt: "2026-03-19T09:30:00.000Z",
  },
  {
    id: "be366dd7-d4dc-4eda-90ad-f1108be5a8ab",
    ownerUserId: null,
    name: "Greek Yogurt",
    brand: "Generic",
    servingSizeText: "170 g",
    calories: 100,
    proteinG: 17,
    carbsG: 6,
    fatG: 0,
    source: "seed",
    externalRef: "seed:greek-yogurt-170g",
    createdAt: "2026-03-19T09:30:00.000Z",
    updatedAt: "2026-03-19T09:30:00.000Z",
  },
  {
    id: "65c46ed1-dd08-4e4f-9f7f-8296d02d6d7b",
    ownerUserId: null,
    name: "Banana",
    brand: "Generic",
    servingSizeText: "1 medium",
    calories: 105,
    proteinG: 1.3,
    carbsG: 27,
    fatG: 0.3,
    source: "seed",
    externalRef: "seed:banana-medium",
    createdAt: "2026-03-19T09:30:00.000Z",
    updatedAt: "2026-03-19T09:30:00.000Z",
  },
  {
    id: "2a35460d-2f16-4019-9972-a0c52fa1b531",
    ownerUserId: null,
    name: "Eggs",
    brand: "Generic",
    servingSizeText: "2 large",
    calories: 144,
    proteinG: 12.6,
    carbsG: 0.8,
    fatG: 9.6,
    source: "seed",
    externalRef: "seed:eggs-2-large",
    createdAt: "2026-03-19T09:30:00.000Z",
    updatedAt: "2026-03-19T09:30:00.000Z",
  },
];

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function mapFoodCatalogItemRow(row: FoodCatalogItemRow): FoodCatalogItem {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    brand: row.brand,
    servingSizeText: row.serving_size_text,
    calories: row.calories,
    proteinG: toNumber(row.protein_g),
    carbsG: toNumber(row.carbs_g),
    fatG: toNumber(row.fat_g),
    source: row.source,
    externalRef: row.external_ref,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapNutritionEntryFoodLinkRow(row: NutritionEntryFoodLinkRow): NutritionEntryFoodLink {
  return {
    id: row.id,
    nutritionEntryId: row.nutrition_entry_id,
    foodCatalogItemId: row.food_catalog_item_id,
    quantity: toNumber(row.quantity),
    unitLabel: row.unit_label,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function readDemoFoodCatalogItems() {
  return readJsonStorage<FoodCatalogItem[]>(demoFoodCatalogItemsStorageKey, demoSeedFoodCatalogItems);
}

function readDemoNutritionEntryFoodLinks() {
  return readJsonStorage<NutritionEntryFoodLink[]>(demoNutritionEntryFoodLinksStorageKey, []);
}

function sortFoodCatalogItems(items: FoodCatalogItem[]) {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
}

export async function listFoodCatalogItems() {
  if (!hasSupabaseClient()) {
    return sortFoodCatalogItems(readDemoFoodCatalogItems());
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("food_catalog_items")
      .select(foodCatalogItemSelect)
      .order("name", { ascending: true })
      .returns<FoodCatalogItemRow[]>();

    if (error) {
      throw error;
    }

    return data.map(mapFoodCatalogItemRow);
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return sortFoodCatalogItems(readDemoFoodCatalogItems());
    }

    throw error;
  }
}

export async function getFoodCatalogItem(id: string) {
  const items = await listFoodCatalogItems();
  return items.find((item) => item.id === id) ?? null;
}

export async function listNutritionEntryFoodLinks(nutritionEntryId?: string) {
  const user = await getCurrentUser();

  if (!user) {
    const fallbackLinks = readDemoNutritionEntryFoodLinks();
    return nutritionEntryId
      ? fallbackLinks.filter((link) => link.nutritionEntryId === nutritionEntryId)
      : fallbackLinks;
  }

  if (!hasSupabaseClient()) {
    const fallbackLinks = readDemoNutritionEntryFoodLinks();
    return nutritionEntryId
      ? fallbackLinks.filter((link) => link.nutritionEntryId === nutritionEntryId)
      : fallbackLinks;
  }

  try {
    const client = requireSupabaseClient();
    let query = client
      .from("nutrition_entry_food_links")
      .select(nutritionEntryFoodLinkSelect)
      .order("created_at", { ascending: false });

    if (nutritionEntryId) {
      query = query.eq("nutrition_entry_id", nutritionEntryId);
    }

    const { data, error } = await query.returns<NutritionEntryFoodLinkRow[]>();

    if (error) {
      throw error;
    }

    return data.map(mapNutritionEntryFoodLinkRow);
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      const fallbackLinks = readDemoNutritionEntryFoodLinks();
      return nutritionEntryId
        ? fallbackLinks.filter((link) => link.nutritionEntryId === nutritionEntryId)
        : fallbackLinks;
    }

    throw error;
  }
}
