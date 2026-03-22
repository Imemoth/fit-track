import type {
  MeasurementEntry,
  NutritionEntry,
  WeightEntry,
  WorkoutSession,
} from "@/lib/api";

export type ExportModuleId = "weight" | "nutrition" | "workouts" | "measurements";

type ExportPayloadInput = {
  weightEntries: WeightEntry[];
  nutritionEntries: NutritionEntry[];
  workoutSessions: WorkoutSession[];
  measurementEntries: MeasurementEntry[];
  selectedModules: ExportModuleId[];
};

type WorkbookSheet = {
  name: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatWorkoutSetSummary(sets: Array<Record<string, unknown>>) {
  if (sets.length === 0) {
    return "";
  }

  return sets
    .map((set, index) => {
      const parts = Object.entries(set)
        .filter(([, value]) => value !== null && value !== undefined && value !== "")
        .map(([key, value]) => `${key}: ${String(value)}`);

      return parts.length > 0 ? `${index + 1}. ${parts.join(" | ")}` : `${index + 1}. szett`;
    })
    .join(" || ");
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function sanitizeSheetName(value: string) {
  return value.replace(/[\\/?*\[\]:]/g, " ").slice(0, 31);
}

function buildWorkbookXml(sheets: WorkbookSheet[]) {
  const worksheetXml = sheets
    .map((sheet) => {
      const headerRow = `<Row>${sheet.headers
        .map(
          (header) =>
            `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`
        )
        .join("")}</Row>`;

      const dataRows = sheet.rows
        .map(
          (row) =>
            `<Row>${row
              .map((value) => {
                if (typeof value === "number" && Number.isFinite(value)) {
                  return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
                }

                return `<Cell><Data ss:Type="String">${escapeXml(
                  value === null || value === undefined ? "" : String(value)
                )}</Data></Cell>`;
              })
              .join("")}</Row>`
        )
        .join("");

      return `<Worksheet ss:Name="${escapeXml(sanitizeSheetName(sheet.name))}"><Table>${headerRow}${dataRows}</Table></Worksheet>`;
    })
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="header">
   <Font ss:Bold="1"/>
  </Style>
 </Styles>
 ${worksheetXml}
</Workbook>`;
}

export function buildJsonBackupPayload({
  weightEntries,
  nutritionEntries,
  workoutSessions,
  measurementEntries,
  selectedModules,
}: ExportPayloadInput) {
  const payload: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    version: 1,
    modules: selectedModules,
  };

  if (selectedModules.includes("weight")) {
    payload.weightEntries = weightEntries;
  }

  if (selectedModules.includes("nutrition")) {
    payload.nutritionEntries = nutritionEntries;
  }

  if (selectedModules.includes("workouts")) {
    payload.workoutSessions = workoutSessions;
  }

  if (selectedModules.includes("measurements")) {
    payload.measurementEntries = measurementEntries;
  }

  return payload;
}

export function buildWorkbookExport({
  weightEntries,
  nutritionEntries,
  workoutSessions,
  measurementEntries,
  selectedModules,
}: ExportPayloadInput) {
  const sheets: WorkbookSheet[] = [];

  if (selectedModules.includes("weight")) {
    sheets.push({
      name: "Súly",
      headers: ["Dátum", "Súly (kg)", "Megjegyzés", "Létrehozva", "Frissítve"],
      rows: weightEntries.map((entry) => [
        entry.entryDate,
        entry.weightKg,
        entry.note,
        entry.createdAt,
        entry.updatedAt,
      ]),
    });
  }

  if (selectedModules.includes("nutrition")) {
    sheets.push({
      name: "Étkezés",
      headers: [
        "Dátum",
        "Étkezés típusa",
        "Étel neve",
        "Kalória",
        "Fehérje (g)",
        "Szénhidrát (g)",
        "Zsír (g)",
        "Létrehozva",
        "Frissítve",
      ],
      rows: nutritionEntries.map((entry) => [
        entry.entryDate,
        entry.mealType,
        entry.itemName,
        entry.calories,
        entry.proteinG,
        entry.carbsG,
        entry.fatG,
        entry.createdAt,
        entry.updatedAt,
      ]),
    });
  }

  if (selectedModules.includes("measurements")) {
    sheets.push({
      name: "Testméretek",
      headers: [
        "Dátum",
        "Derék (cm)",
        "Csípő (cm)",
        "Mellkas (cm)",
        "Kar (cm)",
        "Comb (cm)",
        "Nyak (cm)",
        "Létrehozva",
        "Frissítve",
      ],
      rows: measurementEntries.map((entry) => [
        entry.entryDate,
        entry.waistCm,
        entry.hipsCm,
        entry.chestCm,
        entry.armCm,
        entry.thighCm,
        entry.neckCm,
        entry.createdAt,
        entry.updatedAt,
      ]),
    });
  }

  if (selectedModules.includes("workouts")) {
    sheets.push({
      name: "Edzések",
      headers: [
        "Dátum",
        "Edzés címe",
        "Időtartam (perc)",
        "Megjegyzés",
        "Gyakorlatok száma",
        "Létrehozva",
        "Frissítve",
      ],
      rows: workoutSessions.map((session) => [
        session.sessionDate,
        session.title,
        session.durationMinutes,
        session.note,
        session.exercises.length,
        session.createdAt,
        session.updatedAt,
      ]),
    });

    sheets.push({
      name: "Gyakorlatok",
      headers: [
        "Edzés dátuma",
        "Edzés címe",
        "Gyakorlat neve",
        "Sorrend",
        "Szettek száma",
        "Szettek összefoglaló",
      ],
      rows: workoutSessions.flatMap((session) =>
        session.exercises.map((exercise) => [
          session.sessionDate,
          session.title,
          exercise.exerciseName,
          exercise.sortOrder,
          exercise.sets.length,
          formatWorkoutSetSummary(exercise.sets),
        ])
      ),
    });
  }

  return {
    filename: buildWorkbookFilename(selectedModules),
    content: buildWorkbookXml(sheets),
    sheetCount: sheets.length,
  };
}

export function downloadWorkbook(filename: string, content: string) {
  downloadTextFile(filename, content, "application/vnd.ms-excel;charset=utf-8");
}

export function downloadJsonBackup(filename: string, payload: unknown) {
  downloadTextFile(filename, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
}

export function buildWorkbookFilename(selectedModules: ExportModuleId[]) {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const moduleStamp = selectedModules.join("-") || "empty";
  return `fit-track-export-${moduleStamp}-${dateStamp}.xls`;
}

export function buildJsonBackupFilename(selectedModules: ExportModuleId[]) {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const moduleStamp = selectedModules.join("-") || "empty";
  return `fit-track-backup-${moduleStamp}-${dateStamp}.json`;
}
