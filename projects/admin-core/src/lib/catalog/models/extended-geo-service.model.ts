import { GeoServiceModel } from '@tailormap-admin/admin-api';

export interface ExtendedGeoServiceModel extends GeoServiceModel {
  expanded?: boolean;
  layers: string[];
  catalogNodeId: string;
}
