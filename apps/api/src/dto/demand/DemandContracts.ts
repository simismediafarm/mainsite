export interface DemandSnapshotDTO {
  entityId: string;
  opportunityScore: number;
  forecastConfidence: number;
  traceId: string;
}

export interface DemandForecastDTO {
  entityId: string;
  predictedScore: number;
  confidenceInterval: number;
  forecastDate: Date;
}
