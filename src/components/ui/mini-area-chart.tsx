import { useId, useState } from "react";

import "@/styles/trend-cards.css";

export type TrendPoint = {
  label: string;
  value: number | null;
};

type MiniAreaChartProps = {
  points: TrendPoint[];
  tone?: "mint" | "amber" | "lime" | "clay";
  emptyLabel: string;
  className?: string;
};

type ChartPoint = {
  x: number;
  y: number;
  value: number;
  label: string;
};

const VIEWBOX_WIDTH = 320;
const VIEWBOX_HEIGHT = 128;
const LEFT_PADDING = 8;
const RIGHT_PADDING = 8;
const TOP_PADDING = 12;
const BOTTOM_PADDING = 18;

const tonePalette = {
  mint: {
    lineStart: "#85f0c8",
    lineEnd: "#d6fff0",
    fillStart: "#85f0c8",
    fillEnd: "#85f0c8",
  },
  amber: {
    lineStart: "#ffb764",
    lineEnd: "#ffd9a8",
    fillStart: "#ffb764",
    fillEnd: "#ffb764",
  },
  lime: {
    lineStart: "#d2ff66",
    lineEnd: "#efff9a",
    fillStart: "#d2ff66",
    fillEnd: "#d2ff66",
  },
  clay: {
    lineStart: "#f2784b",
    lineEnd: "#ff9d76",
    fillStart: "#f2784b",
    fillEnd: "#f2784b",
  },
} as const;

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function buildSegments(points: TrendPoint[]) {
  const validPoints = points.filter((point): point is TrendPoint & { value: number } => {
    return typeof point.value === "number" && Number.isFinite(point.value);
  });

  if (validPoints.length === 0) {
    return { segments: [] as ChartPoint[][], hasData: false };
  }

  const values = validPoints.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min;
  const padding = spread === 0 ? Math.max(max * 0.08, 1) : spread * 0.18;
  const adjustedMin = min - padding;
  const adjustedMax = max + padding;
  const usableWidth = VIEWBOX_WIDTH - LEFT_PADDING - RIGHT_PADDING;
  const usableHeight = VIEWBOX_HEIGHT - TOP_PADDING - BOTTOM_PADDING;
  const stepX = points.length === 1 ? 0 : usableWidth / (points.length - 1);

  const scaleY = (value: number) =>
    TOP_PADDING +
    (1 - (value - adjustedMin) / (adjustedMax - adjustedMin)) * usableHeight;

  const segments: ChartPoint[][] = [];
  let currentSegment: ChartPoint[] = [];

  points.forEach((point, index) => {
    if (point.value === null || !Number.isFinite(point.value)) {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }

      return;
    }

    currentSegment.push({
      x: LEFT_PADDING + stepX * index,
      y: scaleY(point.value),
      value: point.value,
      label: point.label,
    });
  });

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return { segments, hasData: true };
}

function buildLinePath(segment: ChartPoint[]) {
  return segment
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
}

function buildAreaPath(segment: ChartPoint[]) {
  const baselineY = VIEWBOX_HEIGHT - BOTTOM_PADDING;
  const start = segment[0];
  const end = segment[segment.length - 1];

  return `${buildLinePath(segment)} L ${end.x.toFixed(1)} ${baselineY} L ${start.x.toFixed(1)} ${baselineY} Z`;
}

function formatTooltipValue(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

export function MiniAreaChart({
  points,
  tone = "mint",
  emptyLabel,
  className,
}: MiniAreaChartProps) {
  const gradientId = useId();
  const [activePoint, setActivePoint] = useState<ChartPoint | null>(null);
  const { segments, hasData } = buildSegments(points);
  const palette = tonePalette[tone];

  if (!hasData) {
    return (
      <div className={joinClasses("mini-area-chart mini-area-chart--empty", className)}>
        <div className="mini-area-chart__empty-copy">
          <span className="mini-area-chart__empty-label">{emptyLabel}</span>
          <span className="mini-area-chart__empty-detail">A chart akkor jelenik meg, ha van eleg adat.</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={joinClasses("mini-area-chart", `mini-area-chart--${tone}`, className)}
      onMouseLeave={() => setActivePoint(null)}
    >
      {activePoint ? (
        <div
          className="mini-area-chart__tooltip"
          role="note"
          style={{
            left: `${(activePoint.x / VIEWBOX_WIDTH) * 100}%`,
            top: `${(activePoint.y / VIEWBOX_HEIGHT) * 100}%`,
          }}
        >
          <strong>{activePoint.label}</strong>
          <span>{formatTooltipValue(activePoint.value)}</span>
        </div>
      ) : null}

      <svg
        className="mini-area-chart__svg"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={emptyLabel}
      >
        <defs>
          <linearGradient id={`${gradientId}-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={palette.fillStart} stopOpacity="0.36" />
            <stop offset="100%" stopColor={palette.fillEnd} stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id={`${gradientId}-line`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={palette.lineStart} />
            <stop offset="100%" stopColor={palette.lineEnd} />
          </linearGradient>
        </defs>

        <line
          className="mini-area-chart__baseline"
          x1={LEFT_PADDING}
          x2={VIEWBOX_WIDTH - RIGHT_PADDING}
          y1={VIEWBOX_HEIGHT - BOTTOM_PADDING}
          y2={VIEWBOX_HEIGHT - BOTTOM_PADDING}
        />

        {segments.map((segment, index) => (
          <g key={`${segment.length}-${index}`}>
            <path
              className="mini-area-chart__area"
              d={buildAreaPath(segment)}
              fill={`url(#${gradientId}-fill)`}
            />
            <path
              className="mini-area-chart__line"
              d={buildLinePath(segment)}
              stroke={`url(#${gradientId}-line)`}
            />
            {segment.map((point, pointIndex) => (
              <circle
                key={`${point.x}-${pointIndex}`}
                className="mini-area-chart__dot"
                cx={point.x}
                cy={point.y}
                r={pointIndex === segment.length - 1 ? 4 : 2.8}
                tabIndex={0}
                onMouseEnter={() => setActivePoint(point)}
                onFocus={() => setActivePoint(point)}
                onBlur={() => setActivePoint(null)}
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
