import { GeoServiceModel } from '../models';
import { Observable } from 'rxjs';
import { CatalogNodeModel } from '../models/catalog-node.model';

export interface TailormapAdminApiV1ServiceModel {
  getCatalog$(): Observable<CatalogNodeModel[]>;
  getGeoService$(params: { id: number }): Observable<GeoServiceModel>;
}
