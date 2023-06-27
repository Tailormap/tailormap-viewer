import { Observable } from 'rxjs';
import {
  CatalogNodeModel, GeoServiceModel, GeoServiceWithLayersModel, GroupModel, FeatureSourceModel, UserModel, ApplicationModel, ConfigModel, OIDCConfigurationModel,
} from '../models';

export interface TailormapAdminApiV1ServiceModel {
  getCatalog$(): Observable<CatalogNodeModel[]>;
  updateCatalog$(catalog: CatalogNodeModel[]): Observable<CatalogNodeModel[]>;
  getGeoService$(params: { id: string }): Observable<GeoServiceWithLayersModel>;
  getGeoServices$(params: { ids: string[] }): Observable<GeoServiceWithLayersModel[]>;
  getAllGeoServices$(params: { excludingIds: string[] }): Observable<GeoServiceWithLayersModel[]>;
  createGeoService$(params: { geoService: Omit<GeoServiceModel, 'id' | 'type'>; refreshCapabilities: boolean}): Observable<GeoServiceWithLayersModel>;
  updateGeoService$(params: { id: string; geoService: Omit<Partial<GeoServiceModel>, 'type'> }): Observable<GeoServiceWithLayersModel>;
  deleteGeoService$(params: { id: string }): Observable<boolean>;
  refreshGeoService$(params: { id: string }): Observable<GeoServiceWithLayersModel>;
  getFeatureSource$(params: { id: string }): Observable<FeatureSourceModel>;
  getFeatureSources$(params: { ids: string[] }): Observable<FeatureSourceModel[]>;
  getAllFeatureSources$(params: { excludingIds: string[] }): Observable<FeatureSourceModel[]>;
  createFeatureSource$(params: { featureSource: Omit<FeatureSourceModel, 'id' | 'type' | 'featureTypes'> }): Observable<FeatureSourceModel>;
  updateFeatureSource$(params: { id: string; featureSource: Omit<Partial<FeatureSourceModel>, 'type' | 'featureTypes'> }): Observable<FeatureSourceModel>;
  deleteFeatureSource$(params: { id: string }): Observable<boolean>;
  refreshFeatureSource$(params: { id: string }): Observable<FeatureSourceModel>;
  getGroups$(): Observable<GroupModel[]>;
  getGroup$(name: string): Observable<GroupModel>;
  createGroup$(params: { group: GroupModel }): Observable<GroupModel>;
  updateGroup$(params: { name: string; group: Partial<GroupModel> }): Observable<GroupModel>;
  deleteGroup$(name: string): Observable<boolean>;
  getUsers$(): Observable<UserModel[]>;
  getUser$(username: string, projection: string): Observable<UserModel>;
  createUser$(params: { user: Omit<UserModel, 'groupNames'> & { groups: string[] } }): Observable<UserModel>;
  updateUser$(params: { username: string; user: Partial<Omit<UserModel, 'groupNames'>> & { groups: string[] } }): Observable<UserModel>;
  deleteUser$(username: string): Observable<boolean>;
  validatePasswordStrength$(password: string): Observable<boolean>;
  getApplications$(): Observable<ApplicationModel[]>;
  createApplication$(params: { application: Partial<Omit<ApplicationModel, 'id'>> }): Observable<ApplicationModel>;
  updateApplication$(params: { id: string; application: Partial<ApplicationModel> }): Observable<ApplicationModel>;
  deleteApplication$(id: string): Observable<boolean>;
  getConfig$(params: { key: string }): Observable<ConfigModel>;
  createConfig$(params: { config: ConfigModel }): Observable<ConfigModel>;
  updateConfig$(params: { config: ConfigModel }): Observable<ConfigModel>;

  getOIDCConfigurations$(): Observable<OIDCConfigurationModel[]>
  createOIDCConfiguration$(params: { oidcConfiguration: Partial<Omit<OIDCConfigurationModel, 'id'>> }): Observable<OIDCConfigurationModel>
  updateOIDCConfiguration$(params: { id: number, oidcConfiguration: Partial<OIDCConfigurationModel> }): Observable<OIDCConfigurationModel>
  deleteOIDCConfiguration$(id: number): Observable<boolean>;
}
