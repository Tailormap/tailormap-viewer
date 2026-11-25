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
   * Optional filter groups to apply. Groups for other layers are ignored. Backend data loaders convert these to CQL
   * (see CqlFilterHelper.getCqlFilterForLayer), client-side data loaders to a predicate (see ClientSideFilterHelper.getFeaturePredicate).
   */
  filterGroups?: FilterGroupModel[];
  /**
   * Optional extent [minx, miny, maxx, maxy] in the map projection to limit the features to.
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
