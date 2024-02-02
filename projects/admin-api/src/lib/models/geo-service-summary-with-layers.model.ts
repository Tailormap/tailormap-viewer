import { GeoServiceLayerModel, GeoServiceSummaryModel } from '@tailormap-admin/admin-api';

export interface GeoServiceSummaryWithLayersModel extends GeoServiceSummaryModel {
  layers: GeoServiceLayerModel[];
}
