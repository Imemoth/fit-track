import type { WorkoutPlanTemplate } from "@/lib/api";
import {
  workoutTemplates,
  type WorkoutTemplate,
} from "@/features/workouts/workout-templates";

const cardioKeywords = [
  "futás",
  "futas",
  "kardió",
  "kardio",
  "séta",
  "seta",
  "intervall",
  "bicikli",
  "evezés",
  "evezes",
  "run",
  "cardio",
  "bike",
  "row",
];
const homeKeywords = [
  "otthon",
  "testsúly",
  "testsuly",
  "plank",
  "fekvotamasz",
  "guggolas",
  "home",
  "bodyweight",
  "push-up",
  "squat",
];
const gymKeywords = [
  "fekvenyomas",
  "edzoterem",
  "lehuzas",
  "rudas",
  "labpres",
  "bench",
  "pulldown",
  "squat",
  "deadlift",
  "dumbbell",
  "upper lower",
  "full body",
];

function includesAnyKeyword(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function inferCategory(template: WorkoutPlanTemplate): WorkoutTemplate["category"] {
  const haystack = `${template.name} ${template.description ?? ""} ${template.exercises
    .map((exercise) => exercise.exerciseName)
    .join(" ")}`.toLowerCase();

  if (includesAnyKeyword(haystack, cardioKeywords)) {
    return "Kardió";
  }

  if (includesAnyKeyword(haystack, homeKeywords)) {
    return "Otthoni edzés";
  }

  if (includesAnyKeyword(haystack, gymKeywords)) {
    return "Edzőterem";
  }

  return "Edzőterem";
}

function inferDurationMinutes(template: WorkoutPlanTemplate) {
  const explicitMinutes = template.exercises.reduce((total, exercise) => {
    return (
      total +
      exercise.targetSets.reduce((setTotal, set) => {
        const durationMin =
          typeof set.durationMin === "number"
            ? set.durationMin
            : typeof set.workMin === "number"
              ? set.workMin
              : 0;

        const rounds = typeof set.rounds === "number" ? set.rounds : 1;
        return setTotal + durationMin * rounds;
      }, 0)
    );
  }, 0);

  if (explicitMinutes > 0) {
    return explicitMinutes;
  }

  return Math.max(template.exercises.length * 10, 20);
}

function inferDifficulty(template: WorkoutPlanTemplate): WorkoutTemplate["difficulty"] {
  const setCount = template.exercises.reduce(
    (total, exercise) => total + exercise.targetSets.length,
    0
  );

  return setCount >= 12 || template.exercises.length >= 5 ? "Közepes" : "Kezdő";
}

function mapWorkoutPlanTemplate(template: WorkoutPlanTemplate): WorkoutTemplate {
  return {
    id: template.id,
    title: template.name,
    category: inferCategory(template),
    difficulty: inferDifficulty(template),
    durationMinutes: inferDurationMinutes(template),
    description: template.description ?? "Előre rögzített edzéstervsablon gyors induláshoz.",
    exercises: template.exercises.map((exercise) => ({
      exerciseName: exercise.exerciseName,
      sets: exercise.targetSets,
    })),
  };
}

export function getWorkoutTemplateCards(templates: WorkoutPlanTemplate[] | undefined) {
  if (!templates || templates.length === 0) {
    return workoutTemplates;
  }

  return templates.map(mapWorkoutPlanTemplate);
}
