import Dexie, { type Table } from "dexie";

export type OfflineQueueItem = {
  id?: number;
  entity: string;
  operation: "insert" | "update" | "delete";
  payload: unknown;
  createdAt: string;
};

export class FitTrackDb extends Dexie {
  offlineQueue!: Table<OfflineQueueItem, number>;

  constructor() {
    super("fit-track-db");

    this.version(1).stores({
      offlineQueue: "++id, entity, operation, createdAt"
    });
  }
}

export const appDb = new FitTrackDb();
