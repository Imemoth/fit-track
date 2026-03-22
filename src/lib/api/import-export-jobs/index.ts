import { getCurrentUser } from "@/lib/api/auth";
import {
  hasSupabaseClient,
  requireSupabaseClient,
  shouldUseDemoFallback,
} from "@/lib/api/auth/client";
import { readJsonStorage } from "@/lib/api/demo/storage";

export type ImportExportJob = {
  id: string;
  userId: string;
  jobType: string;
  status: string;
  format: string;
  resourceType: string;
  fileName: string | null;
  storagePath: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ImportExportJobRow = {
  id: string;
  user_id: string;
  job_type: string;
  status: string;
  format: string;
  resource_type: string;
  file_name: string | null;
  storage_path: string | null;
  error_message: string | null;
  metadata: unknown;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

const importExportJobSelect = `
  id,
  user_id,
  job_type,
  status,
  format,
  resource_type,
  file_name,
  storage_path,
  error_message,
  metadata,
  requested_at,
  started_at,
  completed_at,
  created_at,
  updated_at
`;

const demoImportExportJobsStorageKey = "fit-track.demo.import-export-jobs";

function mapImportExportJobRow(row: ImportExportJobRow): ImportExportJob {
  return {
    id: row.id,
    userId: row.user_id,
    jobType: row.job_type,
    status: row.status,
    format: row.format,
    resourceType: row.resource_type,
    fileName: row.file_name,
    storagePath: row.storage_path,
    errorMessage: row.error_message,
    metadata:
      typeof row.metadata === "object" && row.metadata !== null
        ? (row.metadata as Record<string, unknown>)
        : {},
    requestedAt: row.requested_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function readDemoImportExportJobs() {
  return readJsonStorage<ImportExportJob[]>(demoImportExportJobsStorageKey, []);
}

function sortImportExportJobs(jobs: ImportExportJob[]) {
  return [...jobs].sort((left, right) => right.requestedAt.localeCompare(left.requestedAt));
}

export async function listImportExportJobs() {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  if (!hasSupabaseClient()) {
    return sortImportExportJobs(readDemoImportExportJobs().filter((job) => job.userId === user.id));
  }

  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from("import_export_jobs")
      .select(importExportJobSelect)
      .order("requested_at", { ascending: false })
      .returns<ImportExportJobRow[]>();

    if (error) {
      throw error;
    }

    return data.map(mapImportExportJobRow);
  } catch (error) {
    if (shouldUseDemoFallback(error)) {
      return sortImportExportJobs(readDemoImportExportJobs().filter((job) => job.userId === user.id));
    }

    throw error;
  }
}

export async function getImportExportJob(id: string) {
  const jobs = await listImportExportJobs();
  return jobs.find((job) => job.id === id) ?? null;
}
