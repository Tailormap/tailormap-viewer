import { Observable } from 'rxjs';
import { CatalogNodeModel } from '../models/catalog-node.model';
import { GeoServiceWithLayersModel } from '../models/geo-service-with-layers.model';
import { GeoServiceModel } from '../models';

export interface TailormapAdminApiV1ServiceModel {
  getCatalog$(): Observable<CatalogNodeModel[]>;
  updateCatalog$(catalog: CatalogNodeModel[]): Observable<CatalogNodeModel[]>;
  getGeoService$(params: { id: string }): Observable<GeoServiceWithLayersModel>;
  createGeoService$(params: { geoService: Omit<GeoServiceModel, 'id'> }): Observable<GeoServiceWithLayersModel>;
  updateGeoService$(params: { id: string; geoService: GeoServiceModel }): Observable<GeoServiceWithLayersModel>;
  deleteGeoService$(params: { id: string }): Observable<boolean>;
}
