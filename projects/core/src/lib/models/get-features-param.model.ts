import { Sortorder } from '@tailormap-viewer/api';

/**
 * Parameters for fetching features from a specific layer.
 */
export interface GetFeaturesParams {
  /**
   * The ID of the application.
   */
  applicationId: string;
  /**
   * The ID of the layer to fetch features from.
   */
  layerId: string;
  /**
   * Layer name
   */
  layerName: string;
  /**
   * Optional feature ID to fetch a specific feature.
   */
  __fid?: string;
  /**
   * Optional filters to apply when fetching features, grouped by feature type.
   * Map keys are feature type names, and values are CQL filter strings.
   * Filter for the layer is behind the symbol FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME.
   * @example new Map([['featureTypeName', 'attribute > 100']])
   */
  filter?: Map<string | symbol, string> | null;
  /**
   * Optional page number for paginated results (1, 2, 3, ...).
   */
  page?: number;
  /**
   * Optional page size
   */
  pageSize?: number;
  /**
   * Optional attribute name to sort by.
   */
  sortBy?: string;
  /**
   * Optional sort order (ascending or descending).
   */
  sortOrder?: Sortorder;
  /**
   * Whether to include geometry in the response.
   */
  includeGeometry?: boolean;
}
