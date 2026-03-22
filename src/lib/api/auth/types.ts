import type { Session, User } from "@supabase/supabase-js";

export type AuthUser = {
  id: string;
  email: string | null;
  isAnonymous: boolean;
  createdAt: string;
  lastSignInAt: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  expiresIn: number | null;
  tokenType: string;
  user: AuthUser;
};

export function mapAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    isAnonymous: user.is_anonymous ?? false,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
}

export function mapAuthSession(session: Session): AuthSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? null,
    expiresIn: session.expires_in ?? null,
    tokenType: session.token_type,
    user: mapAuthUser(session.user),
  };
}
