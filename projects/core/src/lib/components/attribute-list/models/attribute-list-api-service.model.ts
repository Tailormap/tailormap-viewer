import {
  LayerExtractCapabilitiesModel, Sortorder, UniqueValuesResponseModel, LayerExtractResponseModel, BoundsModel,
} from '@tailormap-viewer/api';
import { Observable } from 'rxjs';
import { GetFeaturesApiModel } from '../../../models/get-features-api.model';

export enum StatisticType {
  SUM = 'SUM',
  MIN = 'MIN',
  MAX = 'MAX',
  AVERAGE = 'AVG',
  COUNT = 'COUNT',
  NONE = 'NONE',
}

/**
 * Parameters for retrieving extract capabilities of a layer.
 */
export interface GetLayerExtractCapabilitiesParams {
  /**
   * The ID of the application.
   */
  applicationId: string;
  /**
   * The ID of the layer.
   */
  layerId: string;
}

/**
 * Parameters for initiating a layer extract.
 */
export interface GetLayerExtractParams {
  /**
   * The ID of the application.
   */
  applicationId: string;
  /**
   * The ID of the layer to export.
   */
  layerId: string;
  /**
   * the SSE token that is used for reporting progress.
   */
  clientId: string;
  /**
   * The desired output format (e.g., 'csv', 'shape').
   */
  outputFormat: string;
  /**
   * Optional filters to apply when fetching features, grouped by feature type.
   * Map keys are feature type names, and values are CQL filter strings.
   * Filter for the layer is behind the symbol FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME.
   * @example new Map([['featureTypeName', 'attribute > 100']])
   */
  filter?: Map<string | symbol, string> | null;
  /**
   * Optional attribute name to sort by.
   */
  sortBy?: string;
  /**
   * Optional sort order (ascending or descending).
   */
  sortOrder?: Sortorder;
  /**
   * Optional list of attribute names to include in the export.
   */
  attributes?: string[];
  /**
   * Optional coordinate reference system for the export.
   */
  crs?: string;
}

export interface DownloadLayerExtractParams {
  applicationId: string;
  layerId: string;
  downloadId: string;
}

/**
 * Response model for download layer extract operation.
 */
export interface DownloadLayerExtractResponse {
  /**
   * The exported file as a Blob.
   */
  file: Blob;
  /**
   * The suggested file name for the exported file.
   */
  fileName: string;
}

export interface GetUniqueValuesParams {
  /**
   * The ID of the application.
   */
  applicationId: string;
  /**
   * The ID of the layer.
   */
  layerId: string;
  /**
   * The attribute name for which to retrieve unique values.
   */
  attribute: string;
  /**
   * Optional filters to apply when fetching features, grouped by feature type.
   * Map keys are feature type names, and values are CQL filter strings.
   * Filter for the layer is behind the symbol FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME.
   * @example new Map([['featureTypeName', 'attribute > 100']])
   */
  filter?: Map<string | symbol, string> | null;
}

export interface ZoomToExtentBoundsParams {
  /**
   * The ID of the application.
   */
  applicationId: string;
  /**
   * The ID of the layer to zoom to.
   */
  layerId: string;
  /**
   * Optional filters to apply when fetching features, grouped by feature type.
   * Map keys are feature type names, and values are CQL filter strings.
   * Filter for the layer is behind the symbol FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME.
   * @example new Map([['featureTypeName', 'attribute > 100']])
   */
  filter?: Map<string | symbol, string> | null;
}

export interface CanExpandRowParams {
  /**
   * The ID of the application.
   */
  applicationId: string;
  /**
   * The ID of the layer.
   */
  layerId: string;
}

export interface GetFeatureDetailsParams {
  /**
   * The ID of the application.
   */
  applicationId: string;
  /**
   * The ID of the layer.
   */
  layerId: string;
  /**
   * The feature ID.
   */
  __fid: string;
}

export interface FeatureDetailModel {
  /**
   * The feature detail name.
   */
  name: string;
  /**
   * The column definitions (label and key for each attribute column).
   */
  columns: Array<{ label: string; key: string }>;
  /**
   * The attribute values.
   */
  attributes: Array<{ [key: string]: any }>;
}

export interface FeatureDetailsModel {
  /**
   * The feature ID.
   */
  __fid: string;
  /**
   * The attributes of the feature.
   */
  details: FeatureDetailModel[];
}

export interface GetStatisticParams {
  /**
   * The ID of the application.
   */
  applicationId: string;
  /**
   * The ID of the layer
   */
  layerId: string;
  /**
   * List of statistics to fetch
   */
  statistics: Array<{
    /**
     * Key of the column
     */
    column: string;
    /**
     * Type of statistic needed
     */
    type: StatisticType;
  }>;
  /**
   * Optional filters to apply when fetching features, grouped by feature type.
   * Map keys are feature type names, and values are CQL filter strings.
   * Filter for the layer is behind the symbol FeaturesFilterHelper.DEFAULT_FEATURE_TYPE_NAME.
   * @example new Map([['featureTypeName', 'attribute > 100']])
   */
  filter?: Map<string | symbol, string> | null;
}

export interface GetStatisticResponse {
  /**
   * The statistic value. May be null if the statistic could not be calculated successfully.
   */
  result: Array<{
    /**
     * Key of the column
     */
    column: string;
    /**
     * Type of statistic needed
     */
    type: StatisticType;
    /**
     * The statistical value
     */
    value: number;
  }>;
  /**
   * Indicates whether the statistic was successfully calculated. If false, the result may be null or invalid.
   */
  success: boolean;
}

/**
 * Interface for implementing custom attribute list data loaders.
 * Implementations of this interface can be registered as data sources for the attribute list.
 */
export interface AttributeListApiServiceModel extends GetFeaturesApiModel {
  /**
   * Retrieves the export capabilities for a given layer.
   * @param params Parameters specifying the application and layer ID.
   * @returns Observable emitting the export capabilities of the layer.
   */
  getLayerExtractCapabilities$(params: GetLayerExtractCapabilitiesParams): Observable<LayerExtractCapabilitiesModel>;

  /**
   * Initiate the extraction of features from a layer in the specified format.
   * @param params Parameters specifying the export options, including format, filter, and attributes.
   * @returns Observable emitting the exported file and file name, or null if export is not available.
   */
  startLayerExtract$(params: GetLayerExtractParams): Observable<LayerExtractResponseModel | DownloadLayerExtractResponse | null>;

  /**
   * Download the extract file.
   */
  downloadLayerExtract$(params: DownloadLayerExtractParams): Observable<DownloadLayerExtractResponse | null>;

  /**
   * Retrieves unique values for a specific attribute in a layer.
   * @param params Parameters specifying the layer, attribute, and optional filter.
   * @returns Observable emitting the unique values response.
   */
  getUniqueValues$(params: GetUniqueValuesParams): Observable<UniqueValuesResponseModel>;

  /**
   * Determines if rows in the specified layer can be expanded to show more details.
   * @param params Parameters specifying the application and layer ID.
   * @returns Observable emitting a boolean indicating if rows can be expanded.
   */
  canExpandRow$?(params: CanExpandRowParams): Observable<boolean>;

  /**
   * Retrieves detailed information for a specific feature. This is used when expanding rows.
   * @param params Parameters specifying the application, layer ID, and feature ID.
   * @returns Observable emitting the feature details model or null if not found.
   */
  getFeatureDetails$?(params: GetFeatureDetailsParams): Observable<FeatureDetailsModel | null>;

  /**
   * Retrieves statistical information (like sum, avg, etc) for a column
   * @param params Parameters specifying the application, layer ID, type of statistic etc.
   * @returns Observable emitting the statistic value and success status.
   */
  getStatisticValue$?(params: GetStatisticParams): Observable<GetStatisticResponse>;

  /**
   * retrieve the Bounds for the current filter and layer, so the map can zoom to the extent of the current filter.
   * @param params Parameters specifying the application, layer ID, and optional filter.
   * @returns Observable emitting the bounds model or null on error.
   */
  retrieveZoomToExtentBounds$(params: ZoomToExtentBoundsParams): Observable<BoundsModel | null>;
}
