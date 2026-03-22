import type { FormEvent, ReactNode } from "react";

type AuthShellProps = {
  status: "loading" | "signed_out" | "signed_in";
  email?: string;
  error?: string | null;
  successMessage?: string | null;
  pending?: boolean;
  onMagicLinkRequest?: (email: string) => Promise<void> | void;
  onSignOut?: () => Promise<void> | void;
  children: ReactNode;
};

export function AuthShell({
  status,
  email,
  error,
  successMessage,
  pending = false,
  onMagicLinkRequest,
  onSignOut,
  children,
}: AuthShellProps) {
  const isLocalDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  if (status === "loading") {
    return (
      <section className="auth-panel auth-panel--loading">
        <p className="eyebrow">Munkamenet</p>
        <h2>Ellenőrizzük a bejelentkezést.</h2>
        <p className="auth-panel__body">
          Profil- és munkamenetállapot betöltése a napi nézet megnyitása előtt.
        </p>
      </section>
    );
  }

  if (status === "signed_out") {
    return (
      <section className="auth-panel">
        <p className="eyebrow">Újra itt</p>
        <h2>A napot követed, nem a zajt.</h2>
        <p className="auth-panel__body">
          Jelentkezz be, hogy a súly-, étkezési, edzés- és testméretadataid egy helyen
          maradjanak.
        </p>
        <MagicLinkForm onSubmit={onMagicLinkRequest} pending={pending} />
        {successMessage ? <p className="topbar-chip">{successMessage}</p> : null}
        {isLocalDev ? (
          <p className="auth-panel__body">
            Helyi fejlesztésnél a magic link a Mailpitben jelenik meg:
            {" "}
            <a href="http://127.0.0.1:54324" target="_blank" rel="noreferrer">
              http://127.0.0.1:54324
            </a>
          </p>
        ) : null}
        {error ? <p className="auth-panel__error">{error}</p> : null}
      </section>
    );
  }

  return (
    <div className="page-stack">
      <section className="session-strip">
        <div>
          <p className="session-strip__label">Bejelentkezve</p>
          <strong>{email ?? "Aktív fiók"}</strong>
        </div>
        <button type="button" className="inline-action" onClick={() => void onSignOut?.()}>
          Kijelentkezés
        </button>
      </section>
      {children}
    </div>
  );
}

type MagicLinkFormProps = {
  onSubmit?: (email: string) => Promise<void> | void;
  pending: boolean;
};

function MagicLinkForm({ onSubmit, pending }: MagicLinkFormProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email || !onSubmit) {
      return;
    }

    await onSubmit(email);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-form__field">
        <span>E-mail</span>
        <input
          name="email"
          type="email"
          placeholder="te@pelda.hu"
          autoComplete="email"
          disabled={pending}
          required
        />
      </label>
      <button type="submit" className="auth-cta" disabled={pending}>
        {pending ? "Belépési link küldése..." : "Folytatás e-maillel"}
      </button>
    </form>
  );
}
