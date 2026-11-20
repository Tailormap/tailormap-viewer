import { FilterGroupModel, Sortorder } from '@tailormap-viewer/api';

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
   * Optional filter groups the CQL in `filter` was built from, for data loaders that filter features client-side
   * (see ClientSideFilterHelper.getFeaturePredicate). Backend data loaders use `filter` and ignore this.
   */
  filterGroups?: FilterGroupModel[];
  /**
   * Optional extent [minx, miny, maxx, maxy] in the map projection to limit the features to. When set, `filter`
   * also contains the matching CQL BBOX, so backend data loaders can ignore this.
   */
  bbox?: [ number, number, number, number ];
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
  /**
   * Optional point query (feature info): x coordinate in the map projection. Used together with `y` and `distance`.
   */
  x?: number;
  /**
   * Optional point query (feature info): y coordinate in the map projection.
   */
  y?: number;
  /**
   * Optional point query (feature info): search distance around the point, in map units.
   */
  distance?: number;
}
