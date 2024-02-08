import { GeoServiceSummaryModel } from '@tailormap-admin/admin-api';

export interface ExtendedGeoServiceModel extends GeoServiceSummaryModel {
  expanded?: boolean;
  layerIds: string[];
  catalogNodeId: string;
}
