import type { FoodCatalogItem } from "@/lib/api";
import { commonFoods, type CommonFood } from "@/features/nutrition/common-foods";

const breakfastKeywords = [
  "zab",
  "tojás",
  "tojas",
  "rántotta",
  "rantotta",
  "skyr",
  "joghurt",
  "granola",
  "oats",
  "eggs",
  "yogurt",
];
const lunchKeywords = [
  "csirke",
  "rizs",
  "tészta",
  "teszta",
  "szendvics",
  "pulyka",
  "tonhal",
  "chicken",
  "rice",
  "pasta",
  "turkey",
  "tuna",
];
const dinnerKeywords = [
  "lazac",
  "marha",
  "vacsora",
  "steak",
  "burgonya",
  "salmon",
  "beef",
  "potato",
];

export type FoodPickerItem = CommonFood & {
  source?: string;
};

function includesAnyKeyword(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function inferCategory(item: FoodCatalogItem): CommonFood["category"] {
  const haystack = `${item.name} ${item.brand ?? ""}`.toLowerCase();

  if (includesAnyKeyword(haystack, breakfastKeywords)) {
    return "Reggeli";
  }

  if (includesAnyKeyword(haystack, lunchKeywords)) {
    return "Ebéd";
  }

  if (includesAnyKeyword(haystack, dinnerKeywords)) {
    return "Vacsora";
  }

  return "Snack";
}

function mapFoodCatalogItem(item: FoodCatalogItem): FoodPickerItem {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand ?? undefined,
    category: inferCategory(item),
    servingLabel: item.servingSizeText ?? "1 adag",
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    source: item.source,
  };
}

export function getFoodPickerItems(items: FoodCatalogItem[] | undefined) {
  if (!items || items.length === 0) {
    return commonFoods.map((food) => ({
      ...food,
      source: "helyi minta",
    }));
  }

  return items.map(mapFoodCatalogItem);
}
