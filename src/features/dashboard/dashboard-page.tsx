import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listImportExportJobs,
  listMeasurementEntries,
  listNutritionEntries,
  listWeightEntries,
  listWorkoutSessions,
} from "@/lib/api";
import {
  ExportCard,
  ImportStatusCard,
  JobStatusList,
  type ExportOption,
  type ImportStatusTone,
  type JobStatusItem,
  type JobStatusTone,
} from "@/components/data-tools";
import type { TrendPoint } from "@/components/ui/mini-area-chart";
import { MetricCard } from "@/components/ui/metric-card";
import { SectionCard } from "@/components/ui/section-card";
import { TrendCard } from "@/components/ui/trend-card";
import {
  buildWorkbookExport,
  buildJsonBackupFilename,
  buildJsonBackupPayload,
  downloadJsonBackup,
  downloadWorkbook,
  type ExportModuleId,
} from "@/features/dashboard/export-utils";
import { parseImportFile, restorePayload } from "@/features/dashboard/import-utils";

const quickActions = [
  {
    title: "Súly rögzítése",
    detail: "Reggeli mérés 10 másodperc alatt",
    accent: "mint",
    to: "/weight",
  },
  {
    title: "Étkezés hozzáadása",
    detail: "Makrók láthatóan egész nap",
    accent: "amber",
    to: "/nutrition",
  },
  {
    title: "Edzés indítása",
    detail: "Előző edzés gyors ismétléssel",
    accent: "lime",
    to: "/workouts",
  },
] as const;

const exportOptionDefinitions: ExportOption[] = [
  {
    id: "weight",
    label: "Súly",
    description: "Mérések és testsúlytrendek",
  },
  {
    id: "nutrition",
    label: "Étkezés",
    description: "Kalória, makró és étkezési napló",
  },
  {
    id: "workouts",
    label: "Edzések",
    description: "Edzések, gyakorlatok és sablonok",
  },
  {
    id: "measurements",
    label: "Testméretek",
    description: "Derék, csípő, mellkas és további mérések",
  },
];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatEntryDate(value: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getDateOffset(offset: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function buildDateWindow(days: number) {
  return Array.from({ length: days }, (_, index) => getDateOffset(index - (days - 1)));
}

function buildWeightTrend(entries: Awaited<ReturnType<typeof listWeightEntries>>) {
  const recentEntries = [...entries].slice(0, 7).reverse();
  const padding = Array.from({ length: Math.max(0, 7 - recentEntries.length) }, () => ({
    label: "",
    value: null,
  }));

  return [
    ...padding,
    ...recentEntries.map((entry) => ({
      label: formatShortDate(entry.entryDate),
      value: entry.weightKg,
    })),
  ];
}

function buildCalorieTrend(entries: Awaited<ReturnType<typeof listNutritionEntries>>) {
  const dates = buildDateWindow(7);
  const dateSet = new Set(dates);

  if (!entries.some((entry) => dateSet.has(entry.entryDate))) {
    return dates.map((date) => ({
      label: formatShortDate(date),
      value: null,
    }));
  }

  const totalsByDate = new Map<string, number>();

  entries.forEach((entry) => {
    if (dateSet.has(entry.entryDate)) {
      totalsByDate.set(entry.entryDate, (totalsByDate.get(entry.entryDate) ?? 0) + entry.calories);
    }
  });

  return dates.map((date) => ({
    label: formatShortDate(date),
    value: totalsByDate.get(date) ?? 0,
  }));
}

function getDefinedValues(points: TrendPoint[]) {
  return points
    .map((point) => point.value)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

function getDaysAgoDate(daysAgo: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function isWithinLastDays(value: string, days: number) {
  return value >= getDaysAgoDate(days);
}

function mapJobTone(status: string): JobStatusTone {
  switch (status) {
    case "queued":
      return "queued";
    case "running":
    case "processing":
      return "running";
    case "success":
    case "completed":
      return "success";
    case "warning":
    case "partial":
      return "warning";
    default:
      return "error";
  }
}

function mapImportTone(status: string | null): ImportStatusTone {
  switch (status) {
    case "queued":
      return "idle";
    case "running":
    case "processing":
      return "pending";
    case "success":
    case "completed":
      return "success";
    case "warning":
    case "partial":
      return "warning";
    case "failed":
    case "error":
      return "error";
    default:
      return "idle";
  }
}

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedExportModules, setSelectedExportModules] = useState<ExportModuleId[]>(
    exportOptionDefinitions.map((option) => option.id as ExportModuleId)
  );
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [importBusy, setImportBusy] = useState(false);

  const weightQuery = useQuery({
    queryKey: ["weight-entries"],
    queryFn: listWeightEntries,
  });

  const nutritionQuery = useQuery({
    queryKey: ["nutrition-entries"],
    queryFn: listNutritionEntries,
  });

  const workoutQuery = useQuery({
    queryKey: ["workout-sessions"],
    queryFn: listWorkoutSessions,
  });

  const measurementQuery = useQuery({
    queryKey: ["measurement-entries"],
    queryFn: listMeasurementEntries,
  });

  const importExportJobsQuery = useQuery({
    queryKey: ["import-export-jobs"],
    queryFn: listImportExportJobs,
  });

  const todaySummary = useMemo(() => {
    const today = getTodayDate();
    const weightEntries = weightQuery.data ?? [];
    const nutritionEntries = nutritionQuery.data ?? [];
    const workoutSessions = workoutQuery.data ?? [];
    const measurementEntries = measurementQuery.data ?? [];
    const latestWeight = weightEntries[0] ?? null;
    const previousWeight = weightEntries[1] ?? null;
    const latestWorkout = workoutSessions[0] ?? null;
    const latestMeasurement = measurementEntries[0] ?? null;

    const todaysMeals = nutritionEntries.filter((entry) => entry.entryDate === today);
    const nutritionTotals = todaysMeals.reduce(
      (totals, entry) => ({
        calories: totals.calories + entry.calories,
        proteinG: totals.proteinG + entry.proteinG,
      }),
      { calories: 0, proteinG: 0 }
    );

    const recentSignals: string[] = [];

    if (latestWeight) {
      recentSignals.push(
        `${formatEntryDate(latestWeight.entryDate)}: súly rögzítve ${latestWeight.weightKg.toFixed(1)} kg`
      );
    }

    if (todaysMeals[0]) {
      recentSignals.push(
        `${todaysMeals[0].mealType}: rögzítve ${todaysMeals[0].itemName} (${todaysMeals[0].calories} kcal)`
      );
    }

    if (latestWorkout) {
      recentSignals.push(
        `${formatEntryDate(latestWorkout.sessionDate)}: edzés rögzítve – ${latestWorkout.title}`
      );
    }

    if (latestMeasurement?.waistCm !== null && latestMeasurement?.waistCm !== undefined) {
      recentSignals.push(
        `${formatEntryDate(latestMeasurement.entryDate)}: derékmérés ${latestMeasurement.waistCm.toFixed(1)} cm`
      );
    }

    if (recentSignals.length === 0) {
      recentSignals.push("Még nincs friss bejegyzés. Kezdd egy kicsi, de biztos lépéssel.");
    }

    return {
      latestWeight,
      previousWeight,
      latestWorkout,
      latestMeasurement,
      todaysMeals,
      nutritionTotals,
      recentSignals,
    };
  }, [measurementQuery.data, nutritionQuery.data, weightQuery.data, workoutQuery.data]);

  const weeklyWeightPoints = useMemo<TrendPoint[]>(
    () => buildWeightTrend(weightQuery.data ?? []),
    [weightQuery.data]
  );

  const weeklyCaloriesPoints = useMemo<TrendPoint[]>(
    () => buildCalorieTrend(nutritionQuery.data ?? []),
    [nutritionQuery.data]
  );

  const weightTrendValues = useMemo(() => getDefinedValues(weeklyWeightPoints), [weeklyWeightPoints]);
  const calorieTrendValues = useMemo(() => getDefinedValues(weeklyCaloriesPoints), [weeklyCaloriesPoints]);

  const workoutsLast7Days = useMemo(
    () => (workoutQuery.data ?? []).filter((session) => isWithinLastDays(session.sessionDate, 7)).length,
    [workoutQuery.data]
  );

  const measurementFocus = useMemo(() => {
    const latest = measurementQuery.data?.[0] ?? null;
    const previous = measurementQuery.data?.[1] ?? null;

    if (!latest || latest.waistCm === null) {
      return null;
    }

    const delta =
      previous?.waistCm !== null && previous?.waistCm !== undefined
        ? latest.waistCm - previous.waistCm
        : null;

    return {
      date: latest.entryDate,
      value: latest.waistCm,
      delta,
    };
  }, [measurementQuery.data]);

  const todayModules = [
    {
      label: "Súly",
      value: todaySummary.latestWeight ? `${todaySummary.latestWeight.weightKg.toFixed(1)} kg` : "--",
      detail:
        todaySummary.latestWeight && todaySummary.previousWeight
          ? `${(todaySummary.latestWeight.weightKg - todaySummary.previousWeight.weightKg).toFixed(1)} kg az előzőhöz képest`
          : "Legutóbbi rögzített mérés",
      tooltip: todaySummary.latestWeight
        ? `Rögzítve: ${formatEntryDate(todaySummary.latestWeight.entryDate)}`
        : undefined,
    },
    {
      label: "Kalória",
      value: `${todaySummary.nutritionTotals.calories}`,
      detail: `${todaySummary.todaysMeals.length} étkezés rögzítve ma`,
      tooltip:
        todaySummary.todaysMeals.length > 0
          ? `Utolsó étkezés: ${formatEntryDate(todaySummary.todaysMeals[0].entryDate)}`
          : undefined,
    },
    {
      label: "Edzések",
      value: `${workoutsLast7Days}`,
      detail: "Edzés az elmúlt 7 napban",
      tooltip: todaySummary.latestWorkout
        ? `Legutóbbi edzés: ${formatEntryDate(todaySummary.latestWorkout.sessionDate)}`
        : undefined,
    },
    {
      label: "Mérés",
      value: measurementFocus ? `${measurementFocus.value.toFixed(1)} cm` : "--",
      detail: measurementFocus ? "Legutóbbi derékmérés" : "Még nincs rögzített mérés",
      tooltip: measurementFocus
        ? `Rögzítve: ${formatEntryDate(measurementFocus.date)}`
        : undefined,
    },
  ];

  const consistencyValue = Math.max(
    weightQuery.data?.length ?? 0,
    nutritionQuery.data?.length ?? 0,
    workoutQuery.data?.length ?? 0,
    measurementQuery.data?.length ?? 0
  );

  const latestImportJob = useMemo(
    () => (importExportJobsQuery.data ?? []).find((job) => job.jobType.toLowerCase() === "import") ?? null,
    [importExportJobsQuery.data]
  );

  const jobStatusItems = useMemo<JobStatusItem[]>(
    () =>
      (importExportJobsQuery.data ?? []).slice(0, 5).map((job) => ({
        id: job.id,
        label: `${job.jobType} · ${job.resourceType}`,
        statusLabel: job.status,
        tone: mapJobTone(job.status),
        detail: job.fileName ?? job.errorMessage ?? job.format.toUpperCase(),
        timestamp: formatEntryDate(job.requestedAt),
      })),
    [importExportJobsQuery.data]
  );

  const exportOptions = useMemo(
    () =>
      exportOptionDefinitions.map((option) => ({
        ...option,
        selected: selectedExportModules.includes(option.id as ExportModuleId),
      })),
    [selectedExportModules]
  );

  const isLoading =
    weightQuery.isLoading ||
    nutritionQuery.isLoading ||
    workoutQuery.isLoading ||
    measurementQuery.isLoading ||
    importExportJobsQuery.isLoading;

  const hasError =
    weightQuery.isError ||
    nutritionQuery.isError ||
    workoutQuery.isError ||
    measurementQuery.isError ||
    importExportJobsQuery.isError;

  const latestWeightPoint =
    weightTrendValues.length > 0 ? weightTrendValues[weightTrendValues.length - 1] : null;
  const previousWeightPoint =
    weightTrendValues.length > 1 ? weightTrendValues[weightTrendValues.length - 2] : null;
  const weightAverage =
    weightTrendValues.length > 0
      ? weightTrendValues.reduce((sum, value) => sum + value, 0) / weightTrendValues.length
      : null;
  const calorieTotal =
    calorieTrendValues.length > 0 ? calorieTrendValues.reduce((sum, value) => sum + value, 0) : null;
  const calorieAverage =
    calorieTrendValues.length > 0 ? (calorieTotal ?? 0) / calorieTrendValues.length : null;

  function toggleExportOption(id: string) {
    const moduleId = id as ExportModuleId;
    setSelectedExportModules((current) =>
      current.includes(moduleId)
        ? current.filter((value) => value !== moduleId)
        : [...current, moduleId]
    );
  }

  function handleCsvExport() {
    if (selectedExportModules.length === 0) {
      setExportFeedback("Válassz ki legalább egy modult az exporthoz.");
      return;
    }

    const workbook = buildWorkbookExport({
      weightEntries: weightQuery.data ?? [],
      nutritionEntries: nutritionQuery.data ?? [],
      workoutSessions: workoutQuery.data ?? [],
      measurementEntries: measurementQuery.data ?? [],
      selectedModules: selectedExportModules,
    });

    downloadWorkbook(workbook.filename, workbook.content);
    setExportFeedback(`${workbook.sheetCount} munkalapos export elkészült egy fájlban.`);
  }

  function handleJsonBackup() {
    if (selectedExportModules.length === 0) {
      setExportFeedback("Válassz ki legalább egy modult a backuphoz.");
      return;
    }

    const payload = buildJsonBackupPayload({
      weightEntries: weightQuery.data ?? [],
      nutritionEntries: nutritionQuery.data ?? [],
      workoutSessions: workoutQuery.data ?? [],
      measurementEntries: measurementQuery.data ?? [],
      selectedModules: selectedExportModules,
    });

    downloadJsonBackup(buildJsonBackupFilename(selectedExportModules), payload);
    setExportFeedback("A JSON biztonsági mentés letöltése elkészült.");
  }

  function handleExport() {
    handleCsvExport();
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImportBusy(true);
    setImportFeedback(null);

    try {
      const { payload, modules } = await parseImportFile(file);
      const confirmed = window.confirm(
        `A visszaállítás felülírja a jelenlegi adatokat ezekben a modulokban: ${modules.join(", ")}. Folytatod?`
      );

      if (!confirmed) {
        setImportFeedback("A visszaállítás megszakítva.");
        return;
      }

      const result = await restorePayload(payload, modules);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["weight-entries"] }),
        queryClient.invalidateQueries({ queryKey: ["nutrition-entries"] }),
        queryClient.invalidateQueries({ queryKey: ["workout-sessions"] }),
        queryClient.invalidateQueries({ queryKey: ["measurement-entries"] }),
        queryClient.invalidateQueries({ queryKey: ["import-export-jobs"] }),
      ]);

      const importedRows = result.weight + result.nutrition + result.workouts + result.measurements;

      setImportFeedback(`${modules.length} modul helyreállítva, ${importedRows} rekord visszatöltve.`);
    } catch (error) {
      setImportFeedback(
        error instanceof Error ? error.message : "Nem sikerült beolvasni az importfájlt."
      );
    } finally {
      setImportBusy(false);
      event.target.value = "";
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-panel__grid">
          <div>
            <p className="eyebrow">Mai nézet</p>
            <h2>A napod a következő hasznos lépésre nyíljon meg.</h2>
            <p className="hero-panel__body">
              Az app napi irányítópult legyen, ne általános dashboard. Gyors rögzítés, azonnali trend,
              továbblépés.
            </p>
          </div>
          <div className="focus-panel">
            <p className="focus-panel__label">Következetesség</p>
            <p className="focus-panel__value">{consistencyValue}</p>
            <p className="focus-panel__detail">
              {consistencyValue > 0
                ? "Már vannak rögzített bejegyzéseid."
                : "Kezdj rögzíteni egy hasznos sorozat felépítéséhez."}
            </p>
          </div>
        </div>
      </section>

      <div className="quick-actions-grid">
        {quickActions.map((action) => (
          <button
            key={action.title}
            type="button"
            className={`quick-action quick-action--${action.accent}`}
            onClick={() => navigate(action.to)}
          >
            <span className="quick-action__title">{action.title}</span>
            <span className="quick-action__detail">{action.detail}</span>
          </button>
        ))}
      </div>

      <div className="metrics-grid">
        {todayModules.map((item) => (
          <MetricCard
            key={item.label}
            label={item.label}
            value={item.value}
            detail={isLoading ? "Betöltés..." : item.detail}
            tooltip={item.tooltip}
          />
        ))}
      </div>

      <SectionCard
        title="Heti trendek"
        description="Gyorsan olvasható grafikonok a legfontosabb változásokról."
      >
        <div className="trend-card-grid">
          <TrendCard
            eyebrow="Súly 7 pont"
            title="Heti testsúly"
            value={latestWeightPoint !== null ? `${latestWeightPoint.toFixed(1)} kg` : "--"}
            detail={
              latestWeightPoint !== null && previousWeightPoint !== null
                ? `${(latestWeightPoint - previousWeightPoint).toFixed(1)} kg az előző ponthoz képest`
                : "Az első rögzített pont után jelenik meg a változás."
            }
            points={weeklyWeightPoints}
            emptyMessage="Rögzíts néhány súlyadatot, és itt máris látszik a heti trend."
            tone="mint"
            stats={[
              {
                label: "7 napos átlag",
                value: weightAverage !== null ? `${weightAverage.toFixed(1)} kg` : "--",
              },
              {
                label: "Legutóbbi mérés",
                value:
                  weightQuery.data && weightQuery.data[0]
                    ? formatEntryDate(weightQuery.data[0].entryDate)
                    : "--",
              },
            ]}
          />
          <TrendCard
            eyebrow="Kalória 7 nap"
            title="Napi kalóriaösszeg"
            value={calorieTotal !== null ? `${Math.round(calorieTotal)} kcal` : "--"}
            detail="A chart a napi aggregált beviteledet mutatja az utolsó 7 napból."
            points={weeklyCaloriesPoints}
            emptyMessage="A napi étkezések rögzítése után itt jelenik meg a kalóriagörbe."
            tone="amber"
            stats={[
              {
                label: "Mai összesen",
                value: `${todaySummary.nutritionTotals.calories} kcal`,
              },
              {
                label: "7 napos átlag",
                value: calorieAverage !== null ? `${Math.round(calorieAverage)} kcal` : "--",
              },
            ]}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Új jelek"
        description="A dashboard már az edzésekből és a testméretekből is ad visszajelzést."
      >
        <div className="metrics-grid metrics-grid--compact">
          <MetricCard
            label="Legutóbbi edzés"
            value={todaySummary.latestWorkout ? todaySummary.latestWorkout.title : "--"}
            detail={
              todaySummary.latestWorkout
                ? `${formatEntryDate(todaySummary.latestWorkout.sessionDate)} | ${todaySummary.latestWorkout.exercises.length} gyakorlat`
                : "Még nincs rögzített edzés"
            }
          />
          <MetricCard
            label="Mérési fókusz"
            value={measurementFocus ? `${measurementFocus.value.toFixed(1)} cm` : "--"}
            detail={
              measurementFocus
                ? measurementFocus.delta !== null
                  ? `${measurementFocus.delta > 0 ? "+" : ""}${measurementFocus.delta.toFixed(1)} cm az előzőhöz képest`
                  : "Első rögzített derékmérés"
                : "Még nincs derékadat"
            }
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Mai áttekintés"
        description="Mobilon a rövid visszacsatolás többet ér a túl nagy analitikai falaknál."
      >
        <div className="two-column-grid">
          <div className="signal-block">
            <p className="signal-block__eyebrow">Fókusz</p>
            <h3>Csak azt tervezd, ami ma este még számít.</h3>
            <p>
              Legyen egy kiemelt következő lépés. A termék csökkentse a döntési terhet, ne növelje
              több grafikonnal, mint amire reagálni tudsz.
            </p>
          </div>

          <div className="recent-log">
            <p className="recent-log__title">Friss jelek</p>
            {hasError ? (
              <p className="auth-panel__error">
                {weightQuery.error instanceof Error
                  ? weightQuery.error.message
                  : nutritionQuery.error instanceof Error
                    ? nutritionQuery.error.message
                    : workoutQuery.error instanceof Error
                      ? workoutQuery.error.message
                      : measurementQuery.error instanceof Error
                        ? measurementQuery.error.message
                        : "Nem sikerült betölteni a dashboard jeleket."}
              </p>
            ) : (
              <ul className="plain-list plain-list--tight">
                {todaySummary.recentSignals.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Adatműveletek"
        description="Backup, visszatöltés és a háttérfolyamatok állapota egy helyen."
      >
        <div className="two-column-grid">
          <ExportCard
            title="Személyes export"
            description="Egyetlen Excel-kompatibilis fájl külön munkalapokkal, plusz külön JSON backup."
            options={exportOptions}
            formatLabel="Excel export + JSON backup"
            summary={`${selectedExportModules.length} modul kijelölve`}
            actionLabel="Excel export letöltése"
            secondaryActionLabel="JSON backup letöltése"
            disabled={isLoading}
            aside={exportFeedback ? <span className="topbar-chip">{exportFeedback}</span> : null}
            onOptionToggle={toggleExportOption}
            onSubmit={handleCsvExport}
            onSecondarySubmit={handleJsonBackup}
          />

          <ImportStatusCard
            title="JSON visszaállítás"
            description="Korábbi exportfájl teljes backupként való visszatöltése."
            tone={importFeedback ? "success" : mapImportTone(latestImportJob?.status ?? null)}
            primaryLabel={
              importFeedback
                ? "Visszaállítás kész"
                : latestImportJob
                  ? `${latestImportJob.resourceType} · ${latestImportJob.status}`
                  : "Még nincs importfolyamat"
            }
            secondaryLabel={
              importFeedback ??
              latestImportJob?.fileName ??
              "A jelenlegi moduladatok felülírhatók backupból"
            }
            helperText={
              latestImportJob?.errorMessage ??
              "Ez a művelet az érintett modulok jelenlegi adatait törli, majd a backup tartalmát tölti vissza."
            }
            stats={[
              {
                label: "Jobok",
                value: `${importExportJobsQuery.data?.length ?? 0}`,
              },
              {
                label: "Kijelölt modulok",
                value: `${selectedExportModules.length}`,
              },
            ]}
            actionLabel="JSON visszaállítás indítása"
            disabled={importBusy}
            busy={importBusy}
            onSubmit={() => importInputRef.current?.click()}
          />
        </div>

        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          className="sr-only"
          onChange={handleImportFile}
        />

        <div className="section-stack">
          <JobStatusList
            title="Háttérszolgáltatások"
            description="A legutóbbi import/export jobok állapota."
            items={jobStatusItems}
            emptyMessage="Még nincs import- vagy exportjob rögzítve."
          />
        </div>
      </SectionCard>
    </div>
  );
}
