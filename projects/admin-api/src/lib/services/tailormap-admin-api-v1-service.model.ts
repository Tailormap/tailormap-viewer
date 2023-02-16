import { Observable } from 'rxjs';
import { CatalogNodeModel } from '../models/catalog-node.model';
import { GeoServiceWithLayersModel } from '../models/geo-service-with-layers.model';

export interface TailormapAdminApiV1ServiceModel {
  getCatalog$(): Observable<CatalogNodeModel[]>;
  updateCatalog$(catalog: CatalogNodeModel[]): Observable<CatalogNodeModel[]>;
  getGeoService$(params: { id: string }): Observable<GeoServiceWithLayersModel>;
}
