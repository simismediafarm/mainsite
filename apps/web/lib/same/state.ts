import { prisma } from "@simis/database";

export type MigrationPhase = "PHASE_0" | "PHASE_1" | "PHASE_2" | "PHASE_3" | "PHASE_4" | "PHASE_5";

export type EndpointMigrationState = {
  endpoint: string;
  v1TrafficRatio: number;
  v2TrafficRatio: number;
  stabilityScoreV2: number;
  confidence: number;
  phase: MigrationPhase;
  lastShiftAt: number; // Stored as Unix ms internally for SAME
};

export interface MigrationStateStore {
  get(endpoint: string): Promise<EndpointMigrationState>;
  set(endpoint: string, state: EndpointMigrationState): Promise<void>;
  list(): Promise<EndpointMigrationState[]>;
}

export const store: MigrationStateStore = {
  async get(endpoint: string): Promise<EndpointMigrationState> {
    const record = await prisma.migrationState.findUnique({
      where: { endpoint },
    });
    
    if (!record) {
      // Default state initialization
      return {
        endpoint,
        v1TrafficRatio: 1.0,
        v2TrafficRatio: 0.0,
        stabilityScoreV2: 0,
        confidence: 0,
        phase: "PHASE_0",
        lastShiftAt: Date.now()
      };
    }

    return {
      endpoint: record.endpoint,
      v1TrafficRatio: record.v1TrafficRatio,
      v2TrafficRatio: record.v2TrafficRatio,
      stabilityScoreV2: record.stabilityScoreV2,
      confidence: record.confidence,
      phase: record.phase as MigrationPhase,
      lastShiftAt: record.lastShiftAt.getTime()
    };
  },

  async set(endpoint: string, state: EndpointMigrationState): Promise<void> {
    await prisma.migrationState.upsert({
      where: { endpoint },
      update: {
        v1TrafficRatio: state.v1TrafficRatio,
        v2TrafficRatio: state.v2TrafficRatio,
        stabilityScoreV2: state.stabilityScoreV2,
        confidence: state.confidence,
        phase: state.phase,
        lastShiftAt: new Date(state.lastShiftAt)
      },
      create: {
        endpoint: state.endpoint,
        v1TrafficRatio: state.v1TrafficRatio,
        v2TrafficRatio: state.v2TrafficRatio,
        stabilityScoreV2: state.stabilityScoreV2,
        confidence: state.confidence,
        phase: state.phase,
        lastShiftAt: new Date(state.lastShiftAt)
      }
    });

    if (process.env.NODE_ENV !== "test") {
      console.log(`[SAME STATE SAVED] ${endpoint} -> ${state.phase} (V1: ${state.v1TrafficRatio.toFixed(2)}, V2: ${state.v2TrafficRatio.toFixed(2)})`);
    }
  },

  async list(): Promise<EndpointMigrationState[]> {
    const records = await prisma.migrationState.findMany();
    return records.map(record => ({
      endpoint: record.endpoint,
      v1TrafficRatio: record.v1TrafficRatio,
      v2TrafficRatio: record.v2TrafficRatio,
      stabilityScoreV2: record.stabilityScoreV2,
      confidence: record.confidence,
      phase: record.phase as MigrationPhase,
      lastShiftAt: record.lastShiftAt.getTime()
    }));
  }
};
