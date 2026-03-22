import type { ReactNode } from "react";

import "@/styles/data-tools.css";

export type ImportStatusTone = "idle" | "pending" | "success" | "warning" | "error";

export type ImportStatusStat = {
  label: string;
  value: string;
};

type ImportStatusCardProps = {
  title: string;
  description: string;
  tone?: ImportStatusTone;
  primaryLabel: string;
  secondaryLabel?: string;
  helperText?: string;
  stats?: ImportStatusStat[];
  actionLabel?: string;
  disabled?: boolean;
  busy?: boolean;
  aside?: ReactNode;
  onSubmit?: () => void;
};

export function ImportStatusCard({
  title,
  description,
  tone = "idle",
  primaryLabel,
  secondaryLabel,
  helperText,
  stats,
  actionLabel,
  disabled = false,
  busy = false,
  aside,
  onSubmit,
}: ImportStatusCardProps) {
  return (
    <section className={`data-card data-card--import data-card--${tone}`}>
      <header className="data-card__header">
        <div className="data-card__heading">
          <p className="data-card__eyebrow">Import</p>
          <h3 className="data-card__title">{title}</h3>
          <p className="data-card__description">{description}</p>
        </div>
        {aside ? <div className="data-card__aside">{aside}</div> : null}
      </header>

      <div className="data-card__body">
        <div className="import-status">
          <div className="import-status__summary">
            <strong className="import-status__primary">{primaryLabel}</strong>
            {secondaryLabel ? (
              <span className="import-status__secondary">{secondaryLabel}</span>
            ) : null}
          </div>
          {helperText ? <p className="import-status__helper">{helperText}</p> : null}
        </div>

        {stats && stats.length > 0 ? (
          <div className="import-status__stats">
            {stats.map((stat) => (
              <div key={stat.label} className="import-status__stat">
                <span className="import-status__stat-label">{stat.label}</span>
                <strong className="import-status__stat-value">{stat.value}</strong>
              </div>
            ))}
          </div>
        ) : null}

        {actionLabel ? (
          <button
            type="button"
            className="data-card__action"
            onClick={() => onSubmit?.()}
            disabled={disabled || busy}
          >
            {busy ? "Feldolgozás..." : actionLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
