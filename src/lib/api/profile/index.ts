import { getCurrentUser } from "@/lib/api/auth";
import {
  hasSupabaseClient,
  requireSupabaseClient,
  shouldUseDemoFallback,
} from "@/lib/api/auth/client";
import { readJsonStorage, writeJsonStorage } from "@/lib/api/demo/storage";

export type Profile = {
  id: string;
  displayName: string | null;
  heightCm: number | null;
  startWeightKg: number | null;
  goalWeightKg: number | null;
  dailyCalorieGoal: number | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertMyProfileInput = {
  displayName?: string | null;
  heightCm?: number | null;
  startWeightKg?: number | null;
  goalWeightKg?: number | null;
  dailyCalorieGoal?: number | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  height_cm: number | string | null;
  start_weight_kg: number | string | null;
  goal_weight_kg: number | string | null;
  daily_calorie_goal: number | null;
  created_at: string;
  updated_at: string;
};

const profileSelect = `
  id,
  display_name,
  height_cm,
  start_weight_kg,
  goal_weight_kg,
  daily_calorie_goal,
  created_at,
  updated_at
`;

const demoProfilesStorageKey = "fit-track.demo.profiles";

function toNullableNumber(value: number | string | null) {
  if (value === null) {
    return null;
  }

  return typeof value === "number" ? value : Number(value);
}

function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    heightCm: toNullableNumber(row.height_cm),
    startWeightKg: toNullableNumber(row.start_weight_kg),
    goalWeightKg: toNullableNumber(row.goal_weight_kg),
    dailyCalorieGoal: row.daily_calorie_goal,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProfileInput(input: UpsertMyProfileInput) {
  return {
    display_name: input.displayName,
    height_cm: input.heightCm,
    start_weight_kg: input.startWeightKg,
    goal_weight_kg: input.goalWeightKg,
    daily_calorie_goal: input.dailyCalorieGoal,
  };
}

async function requireAuthenticatedUserId() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Bejelentkezés szükséges az adatok kezeléséhez.");
  }

  return user.id;
}

function readDemoProfiles() {
  return readJsonStorage<Record<string, Profile>>(demoProfilesStorageKey, {});
}

function writeDemoProfiles(profiles: Record<string, Profile>) {
  writeJsonStorage(demoProfilesStorageKey, profiles);
}

function getDemoProfile(userId: string) {
  const profiles = readDemoProfiles();
  return profiles[userId] ?? null;
}

function upsertDemoProfile(userId: string, input: UpsertMyProfileInput) {
  const profiles = readDemoProfiles();
  const existingProfile = profiles[userId];
  const now = new Date().toISOString();
  const nextProfile: Profile = {
    id: userId,
    displayName: input.displayName ?? existingProfile?.displayName ?? null,
    heightCm: input.heightCm ?? existingProfile?.heightCm ?? null,
    startWeightKg: input.startWeightKg ?? existingProfile?.startWeightKg ?? null,
    goalWeightKg: input.goalWeightKg ?? existingProfile?.goalWeightKg ?? null,
    dailyCalorieGoal: input.dailyCalorieGoal ?? existingProfile?.dailyCalorieGoal ?? null,
    createdAt: existingProfile?.createdAt ?? now,
    updatedAt: now,
  };

  writeDemoProfiles({
    ...profiles,
    [userId]: nextProfile,
  });

  return nextProfile;
}

export async function getMyProfile() {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    return getDemoProfile(userId);
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("profiles")
      .select(profileSelect)
      .eq("id", userId)
      .maybeSingle<ProfileRow>();

    if (error) {
      throw error;
    }

    return data ? mapProfileRow(data) : null;
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return getDemoProfile(userId);
    }

    throw error;
  }
}

export async function upsertMyProfile(input: UpsertMyProfileInput) {
  const userId = await requireAuthenticatedUserId();

  if (!hasSupabaseClient()) {
    return upsertDemoProfile(userId, input);
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("profiles")
      .upsert(
        {
          id: userId,
          ...mapProfileInput(input),
        },
        { onConflict: "id" }
      )
      .select(profileSelect)
      .single<ProfileRow>();

    if (error) {
      throw error;
    }

    return mapProfileRow(data);
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return upsertDemoProfile(userId, input);
    }

    throw error;
  }
}
