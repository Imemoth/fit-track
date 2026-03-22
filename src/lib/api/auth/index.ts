import type { AuthChangeEvent } from "@supabase/supabase-js";

import {
  clearDemoSession,
  createDemoSession,
  getDemoSession,
  getDemoUser,
  persistDemoSession,
  subscribeDemoAuth,
} from "@/lib/api/demo/auth";
import {
  getBrowserRedirectUrl,
  hasSupabaseClient,
  requireSupabaseClient,
  shouldUseDemoFallback,
} from "./client";
import { mapAuthSession, mapAuthUser } from "./types";

export type { AuthSession, AuthUser } from "./types";
export type { AuthChangeEvent } from "@supabase/supabase-js";

export async function getCurrentSession() {
  if (!hasSupabaseClient()) {
    return getDemoSession();
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session ? mapAuthSession(data.session) : null;
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return getDemoSession();
    }

    throw error;
  }
}

export async function getCurrentUser() {
  if (!hasSupabaseClient()) {
    return getDemoUser();
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user ? mapAuthUser(data.user) : null;
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return getDemoUser();
    }

    throw error;
  }
}

export async function signInWithMagicLink(email: string) {
  if (!hasSupabaseClient()) {
    persistDemoSession(createDemoSession(email));
    return;
  }

  try {
    const client = requireSupabaseClient();
    const redirectTo = getBrowserRedirectUrl();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      persistDemoSession(createDemoSession(email));
      return;
    }

    throw error;
  }
}

export async function signOut() {
  if (!hasSupabaseClient()) {
    clearDemoSession();
    return;
  }

  try {
    const client = requireSupabaseClient();
    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      clearDemoSession();
      return;
    }

    throw error;
  }
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: ReturnType<typeof mapAuthSession> | null) => void
) {
  const localSubscription = subscribeDemoAuth(callback);

  if (!hasSupabaseClient()) {
    return localSubscription;
  }

  try {
    const client = requireSupabaseClient();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      callback(event, session ? mapAuthSession(session) : null);
    });

    return {
      unsubscribe: () => {
        localSubscription.unsubscribe();
        subscription.unsubscribe();
      },
    };
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return localSubscription;
    }

    throw error;
  }
}
