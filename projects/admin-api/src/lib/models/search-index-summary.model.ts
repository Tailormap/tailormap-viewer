export interface SearchIndexSummaryModel {
  total?: number;
  skippedCounter?: number;
  startedAt?: Date | string | null;
  duration?: number;
  errorMessage?: string | null;
}
