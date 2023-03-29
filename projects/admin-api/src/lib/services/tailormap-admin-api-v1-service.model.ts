import { Observable } from 'rxjs';
import { CatalogNodeModel, GeoServiceModel, GeoServiceWithLayersModel, GroupModel, UserModel } from '../models';

export interface TailormapAdminApiV1ServiceModel {
  getCatalog$(): Observable<CatalogNodeModel[]>;
  updateCatalog$(catalog: CatalogNodeModel[]): Observable<CatalogNodeModel[]>;
  getGeoService$(params: { id: string }): Observable<GeoServiceWithLayersModel>;
  createGeoService$(params: { geoService: Omit<GeoServiceModel, 'id'> }): Observable<GeoServiceWithLayersModel>;
  updateGeoService$(params: { id: string; geoService: Partial<GeoServiceModel> }): Observable<GeoServiceWithLayersModel>;
  deleteGeoService$(params: { id: string }): Observable<boolean>;
  getGroups$(): Observable<GroupModel[]>;
  getGroup$(name: string): Observable<GroupModel>;
  createGroup$(params: { group: GroupModel }): Observable<GroupModel>;
  updateGroup$(params: { name: string; group: Partial<GroupModel> }): Observable<GroupModel>;
  deleteGroup$(name: string): Observable<boolean>;
  getUsers$(): Observable<UserModel[]>;
  getUser$(username: string, projection: string): Observable<UserModel>;
  createUser$(params: { user: UserModel }): Observable<UserModel>;
  updateUser$(params: { username: string; user: Partial<UserModel> }): Observable<UserModel>;
  deleteUser$(username: string): Observable<boolean>;
}
