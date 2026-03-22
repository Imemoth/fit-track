type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  tooltip?: string;
};

export function MetricCard({ label, value, detail, tooltip }: MetricCardProps) {
  return (
    <article className={tooltip ? "metric-card metric-card--has-tooltip" : "metric-card"} tabIndex={tooltip ? 0 : undefined}>
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value}</p>
      <p className="metric-card__detail">{detail}</p>
      {tooltip ? (
        <span className="metric-card__tooltip" role="note">
          {tooltip}
        </span>
      ) : null}
    </article>
  );
}
