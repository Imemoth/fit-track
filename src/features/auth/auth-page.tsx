import { useState } from "react";
import { signInWithMagicLink } from "@/lib/api";
import { AuthShell } from "@/features/auth/auth-shell";

export function AuthPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleMagicLinkRequest(email: string) {
    setPending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await signInWithMagicLink(email);
      setSuccessMessage(
        "A belépési link elküldve. Helyi fejlesztésnél a Mailpitben fog megjelenni."
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Nem sikerült elküldeni a belépési linket."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      status="signed_out"
      pending={pending}
      error={error}
      successMessage={successMessage}
      onMagicLinkRequest={handleMagicLinkRequest}
    >
      {null}
    </AuthShell>
  );
}
