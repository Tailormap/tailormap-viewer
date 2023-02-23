import { GeoServiceModel } from '@tailormap-admin/admin-api';

export type GeoServiceUpdateModel = Pick<GeoServiceModel, 'title' | 'protocol' | 'url'>;
export type GeoServiceWithIdUpdateModel = GeoServiceUpdateModel & Pick<GeoServiceModel, 'id'>;
