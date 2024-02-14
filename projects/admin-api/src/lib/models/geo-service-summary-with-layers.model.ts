import { GeoServiceSummaryModel } from './geo-service-summary.model';
import { GeoServiceLayerModel } from './geo-service-layer.model';

export interface GeoServiceSummaryWithLayersModel extends GeoServiceSummaryModel {
  layers: GeoServiceLayerModel[];
}
