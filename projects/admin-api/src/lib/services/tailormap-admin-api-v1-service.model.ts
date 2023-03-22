import { Observable } from 'rxjs';
import { CatalogNodeModel } from '../models/catalog-node.model';
import { GeoServiceWithLayersModel } from '../models/geo-service-with-layers.model';
import { FeatureSourceModel, GeoServiceModel } from '../models';

export interface TailormapAdminApiV1ServiceModel {
  getCatalog$(): Observable<CatalogNodeModel[]>;
  updateCatalog$(catalog: CatalogNodeModel[]): Observable<CatalogNodeModel[]>;
  getGeoService$(params: { id: string }): Observable<GeoServiceWithLayersModel>;
  createGeoService$(params: { geoService: Omit<GeoServiceModel, 'id' | 'type'> }): Observable<GeoServiceWithLayersModel>;
  updateGeoService$(params: { id: string; geoService: Omit<Partial<GeoServiceModel>, 'type'> }): Observable<GeoServiceWithLayersModel>;
  deleteGeoService$(params: { id: string }): Observable<boolean>;
  getFeatureSource$(params: { id: string }): Observable<FeatureSourceModel>;
  createFeatureSource$(params: { featureSource: Omit<FeatureSourceModel, 'id' | 'type' | 'featureTypes'> }): Observable<FeatureSourceModel>;
  updateFeatureSource$(params: { id: string; featureSource: Omit<Partial<FeatureSourceModel>, 'type' | 'featureTypes'> }): Observable<FeatureSourceModel>;
  deleteFeatureSource$(params: { id: string }): Observable<boolean>;
}
