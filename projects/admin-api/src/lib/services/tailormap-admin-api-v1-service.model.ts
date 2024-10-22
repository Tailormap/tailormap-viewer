import { Observable } from 'rxjs';
import {
  CatalogNodeModel, GeoServiceModel, GeoServiceWithLayersModel, GroupModel, FeatureSourceModel, UserModel, ApplicationModel, ConfigModel,
  OIDCConfigurationModel, FeatureTypeModel, UploadModel, FormSummaryModel, FormModel, SearchIndexModel,
  SearchIndexPingResponseModel, TaskModel, TaskDetailsModel,
} from '../models';

export interface TailormapAdminApiV1ServiceModel {
  getCatalog$(): Observable<CatalogNodeModel[]>;
  updateCatalog$(catalog: CatalogNodeModel[]): Observable<CatalogNodeModel[]>;
  getGeoService$(params: { id: string }): Observable<GeoServiceWithLayersModel>;
  createGeoService$(params: { geoService: Omit<GeoServiceModel, 'id' | 'type'>; refreshCapabilities?: boolean}): Observable<GeoServiceWithLayersModel>;
  updateGeoService$(params: { id: string; geoService: Omit<Partial<GeoServiceModel>, 'type'>; refreshCapabilities?: boolean }): Observable<GeoServiceWithLayersModel>;
  deleteGeoService$(params: { id: string }): Observable<boolean>;
  refreshGeoService$(params: { id: string }): Observable<GeoServiceWithLayersModel>;
  getFeatureSource$(params: { id: string }): Observable<FeatureSourceModel>;
  createFeatureSource$(params: { featureSource: Omit<FeatureSourceModel, 'id' | 'type' | 'featureTypes'>; refreshCapabilities?: boolean }): Observable<FeatureSourceModel>;
  updateFeatureSource$(params: {
    id: string;
    featureSource: Omit<Partial<FeatureSourceModel>, 'type' | 'featureTypes'>;
    refreshCapabilities?: boolean;
  }): Observable<FeatureSourceModel>;
  deleteFeatureSource$(params: { id: string }): Observable<boolean>;
  refreshFeatureSource$(params: { id: string }): Observable<FeatureSourceModel>;
  updateFeatureType$(params: {
    id: string;
    featureType: Pick<Partial<FeatureTypeModel>, 'title' | 'comment' | 'settings'>;
  }): Observable<FeatureTypeModel>;
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

  getOIDCConfigurations$(): Observable<OIDCConfigurationModel[]>;
  createOIDCConfiguration$(params: { oidcConfiguration: Partial<Omit<OIDCConfigurationModel, 'id'>> }): Observable<OIDCConfigurationModel>;
  updateOIDCConfiguration$(params: { id: number; oidcConfiguration: Partial<OIDCConfigurationModel> }): Observable<OIDCConfigurationModel>;
  deleteOIDCConfiguration$(id: number): Observable<boolean>;

  getForms$(): Observable<FormSummaryModel[]>;
  getForm$(id: number): Observable<FormModel>;
  createForm$(params: { form: Omit<FormModel, 'id'> }): Observable<FormModel>;
  updateForm$(params: { id: number; form: Partial<FormModel> }): Observable<FormModel>;
  deleteForm$(id: number): Observable<boolean>;

  getUploads$(category?: string): Observable<UploadModel[]>;
  createUpload$(upload: Pick<UploadModel, 'content' | 'filename' | 'category' | 'mimeType'>): Observable<UploadModel>;
  deleteUpload$(uploadId: string): Observable<boolean>;

  pingSearchIndexEngine$(): Observable<SearchIndexPingResponseModel>;
  getSearchIndexes$(): Observable<SearchIndexModel[]>;
  createSearchIndex$(params: { searchIndex: Omit<SearchIndexModel, 'id'> }): Observable<SearchIndexModel>;
  updateSearchIndex$(params: { id: number; searchIndex: Partial<SearchIndexModel> }): Observable<SearchIndexModel>;
  deleteSearchIndex$(id: number): Observable<boolean>;
  reindexSearchIndex$(id: number): Observable<boolean>;
  clearSearchIndex$(id: number): Observable<boolean>;
  getTasks$(): Observable<TaskModel[]>;
  getTaskDetails$(uuid: string, type: string): Observable<TaskDetailsModel>;
}
