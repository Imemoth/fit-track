import "@/styles/data-tools.css";

export type JobStatusTone = "queued" | "running" | "success" | "warning" | "error";

export type JobStatusItem = {
  id: string;
  label: string;
  statusLabel: string;
  tone: JobStatusTone;
  detail?: string;
  timestamp?: string;
};

type JobStatusListProps = {
  title: string;
  description?: string;
  items: JobStatusItem[];
  emptyMessage?: string;
};

export function JobStatusList({
  title,
  description,
  items,
  emptyMessage = "Még nincs folyamat.",
}: JobStatusListProps) {
  return (
    <section className="data-card data-card--jobs">
      <header className="data-card__header">
        <div className="data-card__heading">
          <p className="data-card__eyebrow">Jobállapot</p>
          <h3 className="data-card__title">{title}</h3>
          {description ? <p className="data-card__description">{description}</p> : null}
        </div>
      </header>

      <div className="data-card__body">
        {items.length === 0 ? (
          <div className="job-status-list__empty">{emptyMessage}</div>
        ) : (
          <div className="job-status-list">
            {items.map((item) => (
              <article key={item.id} className="job-status-item">
                <div className={`job-status-item__dot job-status-item__dot--${item.tone}`} />
                <div className="job-status-item__body">
                  <div className="job-status-item__topline">
                    <strong className="job-status-item__label">{item.label}</strong>
                    <span className={`job-status-item__badge job-status-item__badge--${item.tone}`}>
                      {item.statusLabel}
                    </span>
                  </div>
                  {item.detail ? <p className="job-status-item__detail">{item.detail}</p> : null}
                  {item.timestamp ? (
                    <span className="job-status-item__time">{item.timestamp}</span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
