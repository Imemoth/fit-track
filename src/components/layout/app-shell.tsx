import type { PropsWithChildren, ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "@/app/theme-provider";

type TabItem = {
  to: string;
  label: string;
  icon: ReactNode;
};

const tabs: TabItem[] = [
  {
    to: "/",
    label: "Mai nézet",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 8h16" />
        <path d="M8 3v5" />
        <path d="M16 3v5" />
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M9 12h6" />
        <path d="M9 16h3" />
      </svg>
    ),
  },
  {
    to: "/weight",
    label: "Súlynapló",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 6h10" />
        <path d="M12 6V4" />
        <path d="M12 11l2-2" />
        <path d="M5.5 9.5A6.5 6.5 0 0 1 12 6a6.5 6.5 0 0 1 6.5 3.5L20 18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    to: "/nutrition",
    label: "Étkezés",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 4v7" />
        <path d="M10 4v7" />
        <path d="M7 8h3" />
        <path d="M8.5 11v9" />
        <path d="M15 4c1.7 2 1.7 5 0 7v9" />
      </svg>
    ),
  },
  {
    to: "/workouts",
    label: "Edzések",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 10v4" />
        <path d="M7 8v8" />
        <path d="M17 8v8" />
        <path d="M21 10v4" />
        <path d="M7 12h10" />
        <path d="M5 9h2v6H5z" />
        <path d="M17 9h2v6h-2z" />
      </svg>
    ),
  },
  {
    to: "/measurements",
    label: "Méretek",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 16l8-8 8 8" />
        <path d="M7 13l2 2" />
        <path d="M11 9l2 2" />
        <path d="M15 13l2 2" />
      </svg>
    ),
  },
];

type AppShellProps = PropsWithChildren<{
  userEmail?: string | null;
  profileName?: string | null;
}>;

export function AppShell({ children, userEmail, profileName }: AppShellProps) {
  const { theme, toggleTheme } = useTheme();
  const todayLabel = new Intl.DateTimeFormat("hu-HU", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-copy">
          <p className="eyebrow">Fit Track</p>
          <h1>Edzz okosan. Rögzíts gyorsan. Maradj következetes.</h1>
          <p className="topbar-subcopy">
            Napi fókuszú napló étkezéshez, testadatokhoz és edzésekhez.
          </p>
        </div>
        <div className="topbar-meta">
          <button type="button" className="topbar-chip topbar-chip--toggle" onClick={toggleTheme}>
            {theme === "light" ? "Sötét mód" : "Világos mód"}
          </button>
          <div className="topbar-chip">{profileName ?? userEmail ?? "Bejelentkezve"}</div>
          <div className="topbar-chip">Ma: {todayLabel}</div>
          <div className="topbar-chip topbar-chip--muted">Offline mód készenlétben</div>
        </div>
      </header>

      <main className="main-content">{children}</main>

      <nav className="tabbar" aria-label="Fő navigáció">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) =>
              isActive ? "tabbar-link is-active" : "tabbar-link"
            }
          >
            <span className="tabbar-icon" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="tabbar-label">{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
