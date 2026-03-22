import type { ReactNode } from "react";

import { MiniAreaChart, type TrendPoint } from "@/components/ui/mini-area-chart";
import "@/styles/trend-cards.css";

type TrendCardProps = {
  eyebrow: string;
  title: string;
  value: string;
  detail: string;
  points: TrendPoint[];
  emptyMessage: string;
  tone?: "mint" | "amber" | "lime" | "clay";
  stats?: Array<{
    label: string;
    value: string;
    detail?: string;
  }>;
  action?: ReactNode;
  className?: string;
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function TrendCard({
  eyebrow,
  title,
  value,
  detail,
  points,
  emptyMessage,
  tone = "mint",
  stats,
  action,
  className,
}: TrendCardProps) {
  const hasPoints = points.some((point) => typeof point.value === "number" && Number.isFinite(point.value));

  return (
    <article className={joinClasses("trend-card", `trend-card--${tone}`, className)}>
      <div className="trend-card__header">
        <div className="trend-card__heading">
          <p className="trend-card__eyebrow">{eyebrow}</p>
          <h3 className="trend-card__title">{title}</h3>
        </div>
        {action ? <div className="trend-card__action">{action}</div> : null}
      </div>

      <div className="trend-card__body">
        <div className="trend-card__summary">
          <p className="trend-card__value">{hasPoints ? value : "--"}</p>
          <p className="trend-card__detail">{hasPoints ? detail : emptyMessage}</p>
        </div>

        <MiniAreaChart
          points={hasPoints ? points : []}
          tone={tone}
          emptyLabel={emptyMessage}
          className="trend-card__chart"
        />

        {stats && stats.length > 0 ? (
          <div className="trend-card__stats">
            {stats.map((stat) => (
              <div key={stat.label} className="trend-card__stat">
                <span className="trend-card__stat-label">{stat.label}</span>
                <strong className="trend-card__stat-value">{stat.value}</strong>
                {stat.detail ? <span className="trend-card__stat-detail">{stat.detail}</span> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
