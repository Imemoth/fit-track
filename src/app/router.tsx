import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/features/auth/root-layout";

const DashboardPage = lazy(async () => {
  const module = await import("@/features/dashboard/dashboard-page");
  return { default: module.DashboardPage };
});

const WeightPage = lazy(async () => {
  const module = await import("@/features/weight/weight-page");
  return { default: module.WeightPage };
});

const NutritionPage = lazy(async () => {
  const module = await import("@/features/nutrition/nutrition-page");
  return { default: module.NutritionPage };
});

const WorkoutsPage = lazy(async () => {
  const module = await import("@/features/workouts/workouts-page");
  return { default: module.WorkoutsPage };
});

const MeasurementsPage = lazy(async () => {
  const module = await import("@/features/measurements/measurements-page");
  return { default: module.MeasurementsPage };
});

function RouteFallback() {
  return (
    <div className="route-loading-shell">
      <div className="route-loading-panel">
        <p className="eyebrow">Fit Track</p>
        <h1>Betöltés...</h1>
        <p>A következő nézet előkészítése folyamatban van.</p>
      </div>
    </div>
  );
}

function withRouteFallback(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: withRouteFallback(<DashboardPage />),
      },
      {
        path: "weight",
        element: withRouteFallback(<WeightPage />),
      },
      {
        path: "nutrition",
        element: withRouteFallback(<NutritionPage />),
      },
      {
        path: "workouts",
        element: withRouteFallback(<WorkoutsPage />),
      },
      {
        path: "measurements",
        element: withRouteFallback(<MeasurementsPage />),
      },
    ],
  },
]);
