import { useEffect, useState } from "react";
import {
  getCurrentSession,
  getMyProfile,
  onAuthStateChange,
  type AuthSession,
  type Profile,
} from "@/lib/api";

type AuthState =
  | {
      status: "loading";
      session: null;
      profile: null;
      error: null;
    }
  | {
      status: "signed_out";
      session: null;
      profile: null;
      error: string | null;
    }
  | {
      status: "signed_in";
      session: AuthSession;
      profile: Profile | null;
      error: string | null;
    };

const initialState: AuthState = {
  status: "loading",
  session: null,
  profile: null,
  error: null,
};

export function useAuthState() {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    let active = true;

    async function loadInitialState() {
      try {
        const session = await getCurrentSession();

        if (!active) {
          return;
        }

        if (!session) {
          setState({
            status: "signed_out",
            session: null,
            profile: null,
            error: null,
          });
          return;
        }

        const profile = await getMyProfile().catch(() => null);

        if (!active) {
          return;
        }

        setState({
          status: "signed_in",
          session,
          profile,
          error: null,
        });
      } catch (caughtError) {
        if (!active) {
          return;
        }

        setState({
          status: "signed_out",
          session: null,
          profile: null,
          error:
            caughtError instanceof Error
              ? caughtError.message
              : "Failed to resolve auth session.",
        });
      }
    }

    loadInitialState();

    const subscription = onAuthStateChange(async (_event, session) => {
      if (!active) {
        return;
      }

      if (!session) {
        setState({
          status: "signed_out",
          session: null,
          profile: null,
          error: null,
        });
        return;
      }

      const profile = await getMyProfile().catch(() => null);

      if (!active) {
        return;
      }

      setState({
        status: "signed_in",
        session,
        profile,
        error: null,
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
