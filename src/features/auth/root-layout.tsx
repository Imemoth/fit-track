import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { AuthPage } from "@/features/auth/auth-page";
import { AuthShell } from "@/features/auth/auth-shell";
import { useAuthState } from "@/features/auth/use-auth-state";
import { signOut } from "@/lib/api";

export function RootLayout() {
  const authState = useAuthState();

  async function handleSignOut() {
    await signOut();
  }

  if (authState.status === "loading") {
    return <AuthShell status="loading">{null}</AuthShell>;
  }

  if (authState.status === "signed_out") {
    return <AuthPage />;
  }

  return (
    <AppShell
      userEmail={authState.session.user.email ?? undefined}
      profileName={authState.profile?.displayName ?? null}
    >
      <AuthShell
        status="signed_in"
        email={authState.session.user.email ?? undefined}
        onSignOut={handleSignOut}
      >
        <Outlet />
      </AuthShell>
    </AppShell>
  );
}
