import { supabase } from "@/lib/supabase/client";

export class BackendClientNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)."
    );
    this.name = "BackendClientNotConfiguredError";
  }
}

export function requireSupabaseClient() {
  if (!supabase) {
    throw new BackendClientNotConfiguredError();
  }

  return supabase;
}

export function hasSupabaseClient() {
  return Boolean(supabase);
}

export function shouldUseDemoFallback(error: unknown) {
  if (error instanceof BackendClientNotConfiguredError) {
    return true;
  }

  if (error instanceof TypeError) {
    return true;
  }

  if (typeof error !== "object" || error === null || !("message" in error)) {
    return false;
  }

  const message = String(error.message).toLowerCase();

  return (
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("load failed") ||
    message.includes("timed out")
  );
}

export function getBrowserRedirectUrl() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.location.origin;
}
