import type { ReactNode } from "react";

import "@/styles/data-tools.css";

export type ExportOption = {
  id: string;
  label: string;
  description?: string;
  selected?: boolean;
};

type ExportCardProps = {
  title: string;
  description: string;
  options: ExportOption[];
  formatLabel: string;
  summary?: string;
  actionLabel: string;
  secondaryActionLabel?: string;
  disabled?: boolean;
  busy?: boolean;
  aside?: ReactNode;
  onOptionToggle?: (id: string) => void;
  onSubmit?: () => void;
  onSecondarySubmit?: () => void;
};

export function ExportCard({
  title,
  description,
  options,
  formatLabel,
  summary,
  actionLabel,
  secondaryActionLabel,
  disabled = false,
  busy = false,
  aside,
  onOptionToggle,
  onSubmit,
  onSecondarySubmit,
}: ExportCardProps) {
  return (
    <section className="data-card data-card--export">
      <header className="data-card__header">
        <div className="data-card__heading">
          <p className="data-card__eyebrow">Export</p>
          <h3 className="data-card__title">{title}</h3>
          <p className="data-card__description">{description}</p>
        </div>
        {aside ? <div className="data-card__aside">{aside}</div> : null}
      </header>

      <div className="data-card__body">
        <div className="data-option-list">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={option.selected ? "data-option is-selected" : "data-option"}
              onClick={() => onOptionToggle?.(option.id)}
              disabled={disabled}
            >
              <span className="data-option__label">{option.label}</span>
              {option.description ? (
                <span className="data-option__description">{option.description}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="data-card__meta">
          <div className="data-chip-row">
            <span className="data-chip data-chip--accent">{formatLabel}</span>
            {summary ? <span className="data-chip">{summary}</span> : null}
          </div>
          <div className="data-card__actions">
            {secondaryActionLabel ? (
              <button
                type="button"
                className="data-card__action data-card__action--secondary"
                onClick={() => onSecondarySubmit?.()}
                disabled={disabled || busy}
              >
                {secondaryActionLabel}
              </button>
            ) : null}
            <button
              type="button"
              className="data-card__action"
              onClick={() => onSubmit?.()}
              disabled={disabled || busy}
            >
              {busy ? "Export folyamatban..." : actionLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
