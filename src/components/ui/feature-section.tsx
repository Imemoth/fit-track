import type { PropsWithChildren, ReactNode } from "react";

import "@/styles/feature-pages.css";

type FeatureSectionProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}>;

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function FeatureSection({
  eyebrow,
  title,
  description,
  action,
  className,
  children
}: FeatureSectionProps) {
  return (
    <section className={joinClasses("feature-section", className)}>
      <div className="feature-section__header">
        <div className="feature-section__heading">
          {eyebrow ? <p className="feature-section__eyebrow">{eyebrow}</p> : null}
          <h2 className="feature-section__title">{title}</h2>
          {description ? (
            <p className="feature-section__description">{description}</p>
          ) : null}
        </div>
        {action ? <div className="feature-section__action">{action}</div> : null}
      </div>
      <div className="feature-section__content">{children}</div>
    </section>
  );
}
