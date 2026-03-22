import { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createNutritionEntry,
  deleteNutritionEntry,
  listFoodCatalogItems,
  listNutritionEntries,
  updateNutritionEntry,
  type CreateNutritionEntryInput,
  type NutritionEntry,
} from "@/lib/api";
import { FeatureSection } from "@/components/ui/feature-section";
import {
  getFoodPickerItems,
  type FoodPickerItem,
} from "@/features/nutrition/food-catalog-adapter";
import {
  parseLocalizedDecimal,
  sanitizeDecimalInput,
} from "@/lib/forms/decimal";

const nutritionQueryKey = ["nutrition-entries"];
const foodCatalogQueryKey = ["food-catalog-items"];
const mealTypes = ["Reggeli", "Ebéd", "Vacsora", "Snack"];
const categoryFilters = ["Mind", "Reggeli", "Ebéd", "Vacsora", "Snack"];

type NutritionFormState = {
  entryDate: string;
  mealType: string;
  itemName: string;
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildDefaultFormState(): NutritionFormState {
  return {
    entryDate: getTodayDate(),
    mealType: "Reggeli",
    itemName: "",
    calories: "",
    proteinG: "",
    carbsG: "",
    fatG: "",
  };
}

function toFormState(entry: NutritionEntry): NutritionFormState {
  return {
    entryDate: entry.entryDate,
    mealType: entry.mealType,
    itemName: entry.itemName,
    calories: entry.calories.toString(),
    proteinG: entry.proteinG.toString(),
    carbsG: entry.carbsG.toString(),
    fatG: entry.fatG.toString(),
  };
}

function formatEntryDate(value: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value));
}

function scaleFood(food: FoodPickerItem, servings: number) {
  return {
    itemName: food.name,
    calories: Math.round(food.calories * servings * 10) / 10,
    proteinG: Math.round(food.proteinG * servings * 10) / 10,
    carbsG: Math.round(food.carbsG * servings * 10) / 10,
    fatG: Math.round(food.fatG * servings * 10) / 10,
  };
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

export function NutritionPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NutritionFormState>(buildDefaultFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [entryMode, setEntryMode] = useState<"catalog" | "manual">("catalog");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("Mind");
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [servings, setServings] = useState("1");

  const nutritionQuery = useQuery({
    queryKey: nutritionQueryKey,
    queryFn: listNutritionEntries,
  });
  const foodCatalogQuery = useQuery({
    queryKey: foodCatalogQueryKey,
    queryFn: listFoodCatalogItems,
  });

  const saveMutation = useMutation({
    mutationFn: async (
      input: CreateNutritionEntryInput & { id?: string | null }
    ) => {
      if (input.id) {
        return updateNutritionEntry(input.id, {
          entryDate: input.entryDate,
          mealType: input.mealType,
          itemName: input.itemName,
          calories: input.calories,
          proteinG: input.proteinG,
          carbsG: input.carbsG,
          fatG: input.fatG,
        });
      }

      return createNutritionEntry(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nutritionQueryKey });
      setForm(buildDefaultFormState());
      setEditingId(null);
      setFormError(null);
      setEntryMode("catalog");
      setCatalogQuery("");
      setCatalogCategory("Mind");
      setServings("1");
    },
    onError: (error) => {
      setFormError(
        error instanceof Error
          ? error.message
          : "Nem sikerült menteni az étkezési bejegyzést."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNutritionEntry,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nutritionQueryKey });
      if (editingId) {
        setEditingId(null);
        setForm(buildDefaultFormState());
      }
    },
  });

  const entries = nutritionQuery.data ?? [];

  const summary = useMemo(() => {
    const todaysEntries = entries.filter((entry) => entry.entryDate === getTodayDate());

    if (todaysEntries.length === 0) {
      return null;
    }

    return todaysEntries.reduce(
      (totals, entry) => ({
        calories: totals.calories + entry.calories,
        proteinG: totals.proteinG + entry.proteinG,
        carbsG: totals.carbsG + entry.carbsG,
        fatG: totals.fatG + entry.fatG,
      }),
      {
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
      }
    );
  }, [entries]);

  const foodPickerItems = useMemo(
    () => getFoodPickerItems(foodCatalogQuery.data),
    [foodCatalogQuery.data]
  );

  const selectedFood = useMemo(
    () => foodPickerItems.find((food) => food.id === selectedFoodId) ?? null,
    [foodPickerItems, selectedFoodId]
  );

  const filteredFoods = useMemo(() => {
    const normalizedQuery = catalogQuery.trim().toLowerCase();

    return foodPickerItems.filter((food) => {
      const categoryMatch =
        catalogCategory === "Mind" || food.category === catalogCategory;
      const queryMatch =
        !normalizedQuery ||
        food.name.toLowerCase().includes(normalizedQuery) ||
        food.category.toLowerCase().includes(normalizedQuery) ||
        food.brand?.toLowerCase().includes(normalizedQuery);

      return categoryMatch && queryMatch;
    });
  }, [catalogCategory, catalogQuery, foodPickerItems]);

  useEffect(() => {
    if (selectedFoodId || foodPickerItems.length === 0) {
      return;
    }

    setSelectedFoodId(foodPickerItems[0]?.id ?? null);
  }, [foodPickerItems, selectedFoodId]);

  useEffect(() => {
    if (editingId || entryMode !== "catalog" || !selectedFood) {
      return;
    }

    const parsedServings = parseLocalizedDecimal(servings);

    if (!Number.isFinite(parsedServings) || parsedServings <= 0) {
      return;
    }

    const scaled = scaleFood(selectedFood, parsedServings);

    setForm((current) => ({
      ...current,
      mealType: selectedFood.category,
      itemName: scaled.itemName,
      calories: formatNumber(scaled.calories),
      proteinG: formatNumber(scaled.proteinG),
      carbsG: formatNumber(scaled.carbsG),
      fatG: formatNumber(scaled.fatG),
    }));
  }, [editingId, entryMode, selectedFood, servings]);

  function updateForm<K extends keyof NutritionFormState>(
    key: K,
    value: NutritionFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(buildDefaultFormState());
    setFormError(null);
    setEntryMode("catalog");
    setCatalogQuery("");
    setCatalogCategory("Mind");
    setServings("1");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const calories = parseLocalizedDecimal(form.calories);
    const proteinG = parseLocalizedDecimal(form.proteinG || "0");
    const carbsG = parseLocalizedDecimal(form.carbsG || "0");
    const fatG = parseLocalizedDecimal(form.fatG || "0");

    if (!form.entryDate || !form.itemName.trim() || !form.mealType) {
      setFormError("A dátum, az étkezés típusa és az étel neve kötelező.");
      return;
    }

    if (!Number.isFinite(calories) || calories <= 0) {
      setFormError("A kalória pozitív szám kell legyen.");
      return;
    }

    await saveMutation.mutateAsync({
      id: editingId,
      entryDate: form.entryDate,
      mealType: form.mealType,
      itemName: form.itemName.trim(),
      calories,
      proteinG,
      carbsG,
      fatG,
    });
  }

  return (
    <div className="feature-page">
      <FeatureSection
        className="feature-section--hero feature-section--nutrition"
        eyebrow="Mai fókusz"
        title="A következő néhány órára egyél, ne a tökéletes hétre."
        description="Az étkezés oldal azt tartja szem előtt, mi lett ma rögzítve, mi hiányzik még, és mi a következő hasznos lépés."
        action={
          editingId ? (
            <button type="button" className="inline-action" onClick={resetForm}>
              Szerkesztés mégse
            </button>
          ) : null
        }
      >
        <div className="feature-hero">
          <div className="feature-hero__copy">
            <p className="feature-hero__lede">
              A gyors étkezésrögzítés fontosabb, mint a tökéletes elmélet.
              Látszódjon a következő hasznos lépés, a többi ne zavarjon.
            </p>
            <div className="feature-chip-row">
              <span className="feature-chip feature-chip--accent">
                {summary
                  ? `${Math.round(summary.calories)} kcal rögzítve`
                  : "Még nincs étkezés rögzítve"}
              </span>
              <span className="feature-chip">
                {summary
                  ? `${formatNumber(summary.proteinG)} g fehérje`
                  : "Fehérje 0 g"}
              </span>
              <span className="feature-chip feature-chip--muted">
                {entries.length} összes bejegyzés
              </span>
            </div>
          </div>

          <aside className="feature-summary">
            <p className="feature-summary__label">Mai összegzés</p>
            <p className="feature-summary__value">
              {summary ? formatNumber(summary.calories) : "0"} kcal
            </p>
            <p className="feature-summary__detail">
              {summary
                ? "Az aktuális bevitel a mai rögzített étkezések alapján."
                : "Kezdd egy egyszerű étkezési bejegyzéssel, és onnan építsd fel a napot."}
            </p>
            <ul className="feature-summary__list">
              <li className="feature-summary__item">
                <div>
                  <strong>Fehérje</strong>
                  <span>Mai bevitel</span>
                </div>
                <span>{summary ? `${formatNumber(summary.proteinG)} g` : "0 g"}</span>
              </li>
              <li className="feature-summary__item">
                <div>
                  <strong>Szénhidrát / zsír</strong>
                  <span>Makrómegoszlás</span>
                </div>
                <span>
                  {summary
                    ? `${formatNumber(summary.carbsG)} g / ${formatNumber(summary.fatG)} g`
                    : "0 g / 0 g"}
                </span>
              </li>
            </ul>
          </aside>
        </div>
      </FeatureSection>

      <FeatureSection
        title={editingId ? "Étkezés szerkesztése" : "Étkezés hozzáadása"}
        description="Kereshető katalógusválasztóval vagy kézi rögzítés móddal."
      >
        <div className="mode-switch">
          <button
            type="button"
            className={entryMode === "catalog" ? "mode-switch__item is-active" : "mode-switch__item"}
            onClick={() => setEntryMode("catalog")}
          >
            Katalógusból keresek
          </button>
          <button
            type="button"
            className={entryMode === "manual" ? "mode-switch__item is-active" : "mode-switch__item"}
            onClick={() => setEntryMode("manual")}
          >
            Kézzel rögzítek
          </button>
        </div>

        {entryMode === "catalog" ? (
          <div className="food-picker">
            <div className="food-picker__toolbar">
              <label className="entry-form__field">
                <span>Keresés</span>
                <input
                  type="search"
                  placeholder="Keress ételre, kategóriára vagy márkára..."
                  value={catalogQuery}
                  onChange={(event) => setCatalogQuery(event.target.value)}
                />
              </label>
              <label className="entry-form__field">
                <span>Adag</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="1 vagy 1,5"
                  value={servings}
                  onChange={(event) => setServings(sanitizeDecimalInput(event.target.value))}
                />
              </label>
            </div>

            <div className="feature-chip-row feature-chip-row--compact">
              {categoryFilters.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={
                    catalogCategory === category
                      ? "feature-chip feature-chip--accent"
                      : "feature-chip"
                  }
                  onClick={() => setCatalogCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {foodCatalogQuery.isLoading ? (
              <p className="feature-empty-state">Ételkatalógus betöltése...</p>
            ) : null}

            {foodCatalogQuery.isError ? (
              <p className="feature-empty-state">
                {foodCatalogQuery.error instanceof Error
                  ? foodCatalogQuery.error.message
                  : "Nem sikerült betölteni az ételkatalógust."}
              </p>
            ) : null}

            {!foodCatalogQuery.isLoading &&
            !foodCatalogQuery.isError &&
            filteredFoods.length === 0 ? (
              <p className="feature-empty-state">
                Nincs találat erre a keresőre. Próbálj meg másik kulcsszót vagy kategóriát.
              </p>
            ) : null}

            {!foodCatalogQuery.isError && filteredFoods.length > 0 ? (
              <div className="food-picker__results">
                {filteredFoods.slice(0, 12).map((food) => {
                  const isSelected = selectedFoodId === food.id;
                  return (
                    <button
                      key={food.id}
                      type="button"
                      className={isSelected ? "food-card is-selected" : "food-card"}
                      onClick={() => {
                        setSelectedFoodId(food.id);
                        setForm((current) => ({ ...current, mealType: food.category }));
                      }}
                    >
                      <div className="food-card__main">
                        <div>
                          <strong>{food.name}</strong>
                          <p>
                            {food.brand ? `${food.brand} · ` : ""}
                            {food.category} · {food.servingLabel}
                          </p>
                        </div>
                        <span className="food-card__kcal">{food.calories} kcal</span>
                      </div>
                      <div className="food-card__macros">
                        <span>Feh. {formatNumber(food.proteinG)} g</span>
                        <span>Szénh. {formatNumber(food.carbsG)} g</span>
                        <span>Zsír {formatNumber(food.fatG)} g</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {selectedFood ? (
              <div className="food-picker__preview">
                <p className="feature-note__label">Kiválasztott étel</p>
                <h3>{selectedFood.name}</h3>
                <p>
                  {servings} adag alapján automatikusan kitöltjük a kalóriát és a makrókat.
                </p>
                <div className="feature-pill-row">
                  <span className="feature-pill feature-pill--good">
                    {form.calories || 0} kcal
                  </span>
                  <span className="feature-pill feature-pill--cool">
                    Feh. {form.proteinG || 0} g
                  </span>
                  <span className="feature-pill feature-pill--ghost">
                    Szénh. {form.carbsG || 0} g · Zsír {form.fatG || 0} g
                  </span>
                  {selectedFood.source ? (
                    <span className="feature-pill feature-pill--ghost">
                      Forrás: {selectedFood.source}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <form className="entry-form" onSubmit={handleSubmit}>
          <div className="entry-form__grid entry-form__grid--three">
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
              <span>Étkezés típusa</span>
              <select
                value={form.mealType}
                onChange={(event) => updateForm("mealType", event.target.value)}
                disabled={saveMutation.isPending}
              >
                {mealTypes.map((mealType) => (
                  <option key={mealType} value={mealType}>
                    {mealType}
                  </option>
                ))}
              </select>
            </label>
            <label className="entry-form__field">
              <span>Kalória</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="640 vagy 640,5"
                value={form.calories}
                onChange={(event) => updateForm("calories", sanitizeDecimalInput(event.target.value))}
                disabled={saveMutation.isPending}
                required
              />
            </label>
          </div>

          <label className="entry-form__field">
            <span>Étel neve</span>
            <input
              type="text"
              placeholder="Csirkés rizstál"
              value={form.itemName}
              onChange={(event) => updateForm("itemName", event.target.value)}
              disabled={saveMutation.isPending}
              required
            />
          </label>

          <div className="entry-form__grid entry-form__grid--three">
            <label className="entry-form__field">
              <span>Fehérje (g)</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="45 vagy 45,5"
                value={form.proteinG}
                onChange={(event) => updateForm("proteinG", sanitizeDecimalInput(event.target.value))}
                disabled={saveMutation.isPending}
              />
            </label>
            <label className="entry-form__field">
              <span>Szénhidrát (g)</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="62 vagy 62,5"
                value={form.carbsG}
                onChange={(event) => updateForm("carbsG", sanitizeDecimalInput(event.target.value))}
                disabled={saveMutation.isPending}
              />
            </label>
            <label className="entry-form__field">
              <span>Zsír (g)</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="16 vagy 16,5"
                value={form.fatG}
                onChange={(event) => updateForm("fatG", sanitizeDecimalInput(event.target.value))}
                disabled={saveMutation.isPending}
              />
            </label>
          </div>

          <div className="entry-form__actions">
            <button type="submit" className="auth-cta" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Mentés..."
                : editingId
                  ? "Étkezés frissítése"
                  : "Étkezés hozzáadása"}
            </button>
            {formError ? <p className="auth-panel__error">{formError}</p> : null}
          </div>
        </form>
      </FeatureSection>

      <FeatureSection
        title="Étkezési idővonal"
        description="Friss bejegyzések a nap során, gyors szerkesztésre vagy törlésre."
      >
        {nutritionQuery.isLoading ? (
          <div className="placeholder-block">Étkezési előzmények betöltése...</div>
        ) : null}

        {nutritionQuery.isError ? (
          <div className="placeholder-block">
            {nutritionQuery.error instanceof Error
              ? nutritionQuery.error.message
              : "Nem sikerült betölteni az étkezési bejegyzéseket."}
          </div>
        ) : null}

        {!nutritionQuery.isLoading &&
        !nutritionQuery.isError &&
        entries.length === 0 ? (
          <div className="placeholder-block">
            Egy gyors bejegyzés is számít. Kezdd azzal, amit biztosan ettél, és a nap máris követhetőbb lesz.
          </div>
        ) : null}

        {!nutritionQuery.isLoading &&
        !nutritionQuery.isError &&
        entries.length > 0 ? (
          <div className="feature-timeline">
            {entries.map((entry) => (
              <article key={entry.id} className="feature-timeline__item">
                <div className="feature-timeline__time">
                  {formatEntryDate(entry.entryDate)}
                </div>
                <div>
                  <h3 className="feature-timeline__title">{entry.itemName}</h3>
                  <p className="feature-timeline__detail">
                    {entry.mealType} · Feh. {formatNumber(entry.proteinG)} g · Szénh.{" "}
                    {formatNumber(entry.carbsG)} g · Zsír {formatNumber(entry.fatG)} g
                  </p>
                  <div className="feature-pill-row">
                    <span className="feature-pill feature-pill--good">
                      {formatNumber(entry.calories)} kcal
                    </span>
                    <button
                      type="button"
                      className="inline-action"
                      onClick={() => {
                        setEditingId(entry.id);
                        setForm(toFormState(entry));
                        setFormError(null);
                        setEntryMode("manual");
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
              </article>
            ))}
          </div>
        ) : null}
      </FeatureSection>
    </div>
  );
}
