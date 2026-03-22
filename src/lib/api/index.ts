export {
  getCurrentSession,
  getCurrentUser,
  onAuthStateChange,
  signInWithMagicLink,
  signOut,
} from "./auth";
export type { AuthChangeEvent, AuthSession, AuthUser } from "./auth";

export { getMyProfile, upsertMyProfile } from "./profile";
export type { Profile, UpsertMyProfileInput } from "./profile";

export {
  createWeightEntry,
  deleteWeightEntry,
  listWeightEntries,
  updateWeightEntry,
} from "./weight";
export type {
  CreateWeightEntryInput,
  UpdateWeightEntryInput,
  WeightEntry,
} from "./weight";

export {
  createNutritionEntry,
  deleteNutritionEntry,
  listNutritionEntries,
  updateNutritionEntry,
} from "./nutrition";
export type {
  CreateNutritionEntryInput,
  NutritionEntry,
  UpdateNutritionEntryInput,
} from "./nutrition";

export {
  createWorkoutSession,
  deleteWorkoutSession,
  listWorkoutSessions,
  updateWorkoutSession,
} from "./workouts";
export type {
  CreateWorkoutExerciseInput,
  CreateWorkoutSessionInput,
  UpdateWorkoutExerciseInput,
  UpdateWorkoutSessionInput,
  WorkoutExercise,
  WorkoutExerciseSet,
  WorkoutSession,
} from "./workouts";

export {
  createMeasurementEntry,
  deleteMeasurementEntry,
  listMeasurementEntries,
  updateMeasurementEntry,
} from "./measurements";
export type {
  CreateMeasurementEntryInput,
  MeasurementEntry,
  UpdateMeasurementEntryInput,
} from "./measurements";

export {
  getFoodCatalogItem,
  listFoodCatalogItems,
  listNutritionEntryFoodLinks,
} from "./food-catalog";
export type { FoodCatalogItem, NutritionEntryFoodLink } from "./food-catalog";

export { getWorkoutPlanTemplate, listWorkoutPlanTemplates } from "./workout-templates";
export type {
  WorkoutPlanTemplate,
  WorkoutPlanTemplateExercise,
  WorkoutPlanTemplateExerciseSet,
} from "./workout-templates";

export { getImportExportJob, listImportExportJobs } from "./import-export-jobs";
export type { ImportExportJob } from "./import-export-jobs";
