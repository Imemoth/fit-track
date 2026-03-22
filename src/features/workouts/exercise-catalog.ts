export type ExerciseCatalogEntry = {
  name: string;
  aliases?: string[];
  category: "strength" | "bodyweight" | "cardio" | "mobility";
};

export const exerciseCatalog: ExerciseCatalogEntry[] = [
  { name: "Fekvenyomás", aliases: ["Mellről nyomás", "Bench press"], category: "strength" },
  { name: "Ferdepados nyomás", aliases: ["Incline bench press"], category: "strength" },
  { name: "Tárogatás", aliases: ["Dumbbell fly"], category: "strength" },
  { name: "Guggolás", aliases: ["Squat"], category: "strength" },
  { name: "Elöl guggolás", aliases: ["Front squat"], category: "strength" },
  { name: "Bolgár guggolás", aliases: ["Bulgarian split squat"], category: "strength" },
  { name: "Kitörés", aliases: ["Lunge"], category: "strength" },
  { name: "Lábprés", aliases: ["Leg press"], category: "strength" },
  { name: "Combhajlító gép", aliases: ["Leg curl"], category: "strength" },
  { name: "Combfeszítő gép", aliases: ["Leg extension"], category: "strength" },
  { name: "Vádliemelés", aliases: ["Calf raise"], category: "strength" },
  { name: "Felhúzás", aliases: ["Deadlift"], category: "strength" },
  { name: "Román felhúzás", aliases: ["Romanian deadlift"], category: "strength" },
  { name: "Evezés döntött törzzsel", aliases: ["Barbell row"], category: "strength" },
  { name: "Evezés csigán", aliases: ["Seated row"], category: "strength" },
  { name: "Lehúzás mellhez", aliases: ["Lat pulldown"], category: "strength" },
  { name: "Húzódzkodás", aliases: ["Pull-up"], category: "bodyweight" },
  { name: "Tolódzkodás", aliases: ["Dip"], category: "bodyweight" },
  { name: "Vállból nyomás", aliases: ["Overhead press"], category: "strength" },
  { name: "Oldalemelés", aliases: ["Lateral raise"], category: "strength" },
  { name: "Bicepsz hajlítás", aliases: ["Biceps curl"], category: "strength" },
  { name: "Tricepsz letolás", aliases: ["Triceps pushdown"], category: "strength" },
  { name: "Fekvőtámasz", aliases: ["Push-up"], category: "bodyweight" },
  { name: "Hasprés", aliases: ["Crunch"], category: "bodyweight" },
  { name: "Lábemelés", aliases: ["Leg raise"], category: "bodyweight" },
  { name: "Plank", aliases: ["Alkartámasz"], category: "bodyweight" },
  { name: "Burpee", aliases: ["Burpee"], category: "bodyweight" },
  { name: "Ugrókötelezés", aliases: ["Rope skipping"], category: "cardio" },
  { name: "Futás", aliases: ["Running"], category: "cardio" },
  { name: "Gyors séta", aliases: ["Brisk walk"], category: "cardio" },
  { name: "Kerékpár", aliases: ["Cycling"], category: "cardio" },
  { name: "Ellipszis tréner", aliases: ["Elliptical"], category: "cardio" },
  { name: "Evezőgép", aliases: ["Rowing machine"], category: "cardio" },
  { name: "Lépcsőzőgép", aliases: ["Stair climber"], category: "cardio" },
  { name: "Mobilizálás", aliases: ["Mobility"], category: "mobility" },
  { name: "Nyújtás", aliases: ["Stretching"], category: "mobility" },
];

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function rankExerciseSuggestions(
  query: string,
  recentExerciseNames: string[],
  templateExerciseNames: string[]
) {
  const normalizedQuery = normalizeSearchValue(query);
  const recentFrequency = new Map<string, number>();

  recentExerciseNames.forEach((name) => {
    const normalized = normalizeSearchValue(name);
    if (!normalized) return;
    recentFrequency.set(normalized, (recentFrequency.get(normalized) ?? 0) + 1);
  });

  const templateNames = new Set(
    templateExerciseNames.map((name) => normalizeSearchValue(name)).filter(Boolean)
  );

  const merged = new Map<
    string,
    {
      label: string;
      aliases: string[];
      frequency: number;
      fromTemplate: boolean;
    }
  >();

  exerciseCatalog.forEach((entry) => {
    const key = normalizeSearchValue(entry.name);
    merged.set(key, {
      label: entry.name,
      aliases: entry.aliases ?? [],
      frequency: recentFrequency.get(key) ?? 0,
      fromTemplate: templateNames.has(key),
    });
  });

  templateExerciseNames.forEach((name) => {
    const key = normalizeSearchValue(name);
    if (!key || merged.has(key)) return;
    merged.set(key, {
      label: name.trim(),
      aliases: [],
      frequency: recentFrequency.get(key) ?? 0,
      fromTemplate: true,
    });
  });

  recentExerciseNames.forEach((name) => {
    const key = normalizeSearchValue(name);
    if (!key || merged.has(key)) return;
    merged.set(key, {
      label: name.trim(),
      aliases: [],
      frequency: recentFrequency.get(key) ?? 0,
      fromTemplate: false,
    });
  });

  return [...merged.entries()]
    .filter(([, item]) => {
      if (!normalizedQuery) return true;
      const haystacks = [item.label, ...item.aliases].map(normalizeSearchValue);
      return haystacks.some((value) => value.includes(normalizedQuery));
    })
    .sort((a, b) => {
      const [, left] = a;
      const [, right] = b;
      const leftStarts = normalizeSearchValue(left.label).startsWith(normalizedQuery);
      const rightStarts = normalizeSearchValue(right.label).startsWith(normalizedQuery);

      if (leftStarts !== rightStarts) return leftStarts ? -1 : 1;
      if (left.frequency !== right.frequency) return right.frequency - left.frequency;
      if (left.fromTemplate !== right.fromTemplate) return left.fromTemplate ? -1 : 1;
      return left.label.localeCompare(right.label, "hu");
    })
    .map(([, item]) => item.label)
    .slice(0, 24);
}
