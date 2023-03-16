import { GeoServiceModel } from '@tailormap-admin/admin-api';

export type GeoServiceCreateModel = Pick<GeoServiceModel, 'id' | 'title' | 'protocol' | 'url' | 'settings'>;
export type GeoServiceUpdateModel = Partial<Exclude<GeoServiceCreateModel, 'id'>>;
export type GeoServiceWithIdUpdateModel = GeoServiceUpdateModel & Pick<GeoServiceModel, 'id'>;
