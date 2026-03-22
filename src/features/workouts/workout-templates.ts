export type WorkoutTemplate = {
  id: string;
  title: string;
  category: "Kardió" | "Otthoni edzés" | "Edzőterem";
  difficulty: "Kezdő" | "Közepes";
  durationMinutes: number;
  description: string;
  exercises: Array<{
    exerciseName: string;
    sets: Record<string, unknown>[];
  }>;
};

export const workoutTemplates: WorkoutTemplate[] = [
  {
    id: "cardio-interval-start",
    title: "Kezdő intervall kardió",
    category: "Kardió",
    difficulty: "Kezdő",
    durationMinutes: 25,
    description: "Rövid intervall blokk futópadra vagy kinti gyors sétára/futásra.",
    exercises: [
      { exerciseName: "Bemelegítő séta", sets: [{ durationMin: 5, intensity: "konnyu" }] },
      { exerciseName: "Futásintervall", sets: [{ rounds: 6, workMin: 1, restMin: 1 }] },
      { exerciseName: "Levezető séta", sets: [{ durationMin: 5, intensity: "konnyu" }] },
    ],
  },
  {
    id: "home-full-body-30",
    title: "Otthoni teljes test 30 perc",
    category: "Otthoni edzés",
    difficulty: "Kezdő",
    durationMinutes: 30,
    description: "Saját testsúlyos teljes testes edzés minimális eszközigénnyel.",
    exercises: [
      { exerciseName: "Guggolás", sets: [{ reps: 15 }, { reps: 15 }, { reps: 15 }] },
      { exerciseName: "Fekvőtámasz", sets: [{ reps: 10 }, { reps: 10 }, { reps: 8 }] },
      { exerciseName: "Kitörések", sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }] },
      { exerciseName: "Plank", sets: [{ durationSec: 45 }, { durationSec: 45 }] },
    ],
  },
  {
    id: "gym-full-body-a",
    title: "Edzőterem full body A",
    category: "Edzőterem",
    difficulty: "Közepes",
    durationMinutes: 55,
    description: "Alap teljes testes teremprogram alapgyakorlatokkal.",
    exercises: [
      { exerciseName: "Fekvenyomás", sets: [{ reps: 6 }, { reps: 6 }, { reps: 6 }] },
      { exerciseName: "Lehúzás mellhez", sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }] },
      { exerciseName: "Lábprés", sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }] },
      { exerciseName: "Vállból nyomás", sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }] },
    ],
  },
];
