/**
 * Model representing the statistics of an attribute, the values are calculated in the backend.
 * Sum and avg will be null in case of a date-time attribute.
 */
export interface AttributeStatisticsResponseModel {
  filterApplied: boolean;
  /** the minimum value, can be a number or a date-time. */
  min: any;
  /** the maximum value, can be a number or a date-time. */
  max: any;
  /** the record count (or more). */
  count: number;
  sum?: number;
  avg?: number;
}
