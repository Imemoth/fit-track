import type { AuthChangeEvent } from "@supabase/supabase-js";

import type { AuthSession, AuthUser } from "@/lib/api/auth/types";
import { readJsonStorage, removeStorageItem, writeJsonStorage } from "./storage";

const demoAuthStorageKey = "fit-track.demo.auth.session";
const demoAuthListeners = new Set<
  (event: AuthChangeEvent, session: AuthSession | null) => void
>();

function sanitizeEmailForId(email: string) {
  const sanitized = email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return sanitized || "demo-user";
}

function buildDemoUser(email: string): AuthUser {
  const now = new Date().toISOString();

  return {
    id: `demo-user-${sanitizeEmailForId(email)}`,
    email,
    isAnonymous: false,
    createdAt: now,
    lastSignInAt: now,
  };
}

export function getDemoSession() {
  return readJsonStorage<AuthSession | null>(demoAuthStorageKey, null);
}

export function getDemoUser() {
  return getDemoSession()?.user ?? null;
}

export function createDemoSession(email: string) {
  const user = buildDemoUser(email);
  const expiresIn = 60 * 60 * 24 * 30;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  return {
    accessToken: `demo-access-token-${sanitizeEmailForId(email)}`,
    refreshToken: `demo-refresh-token-${sanitizeEmailForId(email)}`,
    expiresAt,
    expiresIn,
    tokenType: "bearer",
    user,
  } satisfies AuthSession;
}

function notifyListeners(event: AuthChangeEvent, session: AuthSession | null) {
  for (const listener of demoAuthListeners) {
    listener(event, session);
  }
}

export function persistDemoSession(session: AuthSession) {
  writeJsonStorage(demoAuthStorageKey, session);
  notifyListeners("SIGNED_IN", session);
}

export function clearDemoSession() {
  removeStorageItem(demoAuthStorageKey);
  notifyListeners("SIGNED_OUT", null);
}

export function subscribeDemoAuth(
  callback: (event: AuthChangeEvent, session: AuthSession | null) => void
) {
  demoAuthListeners.add(callback);

  return {
    unsubscribe: () => {
      demoAuthListeners.delete(callback);
    },
  };
}
