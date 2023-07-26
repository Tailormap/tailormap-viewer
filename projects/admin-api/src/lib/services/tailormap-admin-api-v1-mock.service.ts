import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { TailormapAdminApiV1ServiceModel } from './tailormap-admin-api-v1-service.model';
import * as mockData from '../mock-data/tailormap-admin-api.mock-data';
import {
  CatalogNodeModel, GeoServiceModel, GeoServiceWithLayersModel, GroupModel, FeatureSourceModel, UserModel, ApplicationModel, ConfigModel, OIDCConfigurationModel,
} from '../models';

@Injectable()
export class TailormapAdminApiV1MockService implements TailormapAdminApiV1ServiceModel {

  public delay = 3000;

  public getCatalog$(): Observable<CatalogNodeModel[]> {
    return of(mockData.getCatalogTree()).pipe(delay(this.delay));
  }

  public getGeoService$(params: { id: string }): Observable<GeoServiceWithLayersModel> {
    return of(mockData.getGeoService({
      id: params.id,
      title: 'Service ' + params.id,
    })).pipe(delay(this.delay));
  }

  public getGeoServices$(params: { ids: string[] }): Observable<GeoServiceWithLayersModel[]> {
    return of(params.ids.map(id => mockData.getGeoService({
      id,
      title: 'Service ' + id,
    }))).pipe(delay(this.delay));
  }

  public getAllGeoServices$(): Observable<GeoServiceWithLayersModel[]> {
    return of([mockData.getGeoService()]).pipe(delay(this.delay));
  }

  public updateCatalog$(node: CatalogNodeModel[]): Observable<CatalogNodeModel[]> {
    return of(node).pipe(delay(this.delay));
  }

  public createGeoService$(params: { geoService: GeoServiceModel; refreshCapabilities: boolean }): Observable<GeoServiceWithLayersModel> {
    return of({ ...params.geoService, layers: [] }).pipe(delay(this.delay));
  }

  public updateGeoService$(params: { id: string; geoService: GeoServiceModel }): Observable<GeoServiceWithLayersModel> {
    return of({ ...params.geoService, layers: [] }).pipe(delay(this.delay));
  }

  public deleteGeoService$(_params: { id: string }): Observable<boolean> {
    return of(true).pipe(delay(this.delay));
  }

  public refreshGeoService$(params: { id: string }): Observable<GeoServiceWithLayersModel> {
    return of(mockData.getGeoService({
      id: params.id,
      title: 'Service ' + params.id,
    })).pipe(delay(this.delay));
  }

  public getFeatureSource$(params: { id: string }): Observable<FeatureSourceModel> {
    return of(mockData.getFeatureSource({
      id: params.id,
      title: 'Feature Source ' + params.id,
    })).pipe(delay(this.delay));
  }

  public getFeatureSources$(params: { ids: string[] }): Observable<FeatureSourceModel[]> {
    return of(params.ids.map(id => mockData.getFeatureSource({
      id,
      title: 'Feature Source ' + id,
    }))).pipe(delay(this.delay));
  }

  public getAllFeatureSources$(): Observable<FeatureSourceModel[]> {
    return of([mockData.getFeatureSource()]).pipe(delay(this.delay));
  }

  public createFeatureSource$(params: { featureSource: FeatureSourceModel }): Observable<FeatureSourceModel> {
    return of({ ...params.featureSource }).pipe(delay(this.delay));
  }

  public updateFeatureSource$(params: { id: string; featureSource: FeatureSourceModel }): Observable<FeatureSourceModel> {
    return of({ ...params.featureSource }).pipe(delay(this.delay));
  }

  public deleteFeatureSource$(_params: { id: string }): Observable<boolean> {
    return of(true).pipe(delay(this.delay));
  }

  public refreshFeatureSource$(params: { id: string }): Observable<FeatureSourceModel> {
    return of(mockData.getFeatureSource({
      id: params.id,
      title: 'Feature source ' + params.id,
    })).pipe(delay(this.delay));
  }

  public getGroups$(): Observable<GroupModel[]> {
    return of(mockData.getGroups()).pipe(delay(this.delay));
  }

  public getGroup$(name: string): Observable<GroupModel> {
    return of(mockData.getGroup({ name })).pipe(delay(this.delay));
  }

  public createGroup$(params: { group: GroupModel }): Observable<GroupModel> {
    return of({ ...params.group }).pipe(delay(this.delay));
  }

  public deleteGroup$(_name: string): Observable<boolean> {
    return of(true).pipe(delay(this.delay));
  }

  public updateGroup$(params: { name: string; group: GroupModel }): Observable<GroupModel> {
    return of({ ...params.group }).pipe(delay(this.delay));
  }

  public getUser$(username: string): Observable<any> {
    return of(mockData.getUser( { username })).pipe(delay(this.delay));
  }

  public getUsers$(): Observable<UserModel[]> {
    return of(mockData.getUsers()).pipe(delay(this.delay));
  }

  public createUser$(params: { user: Omit<UserModel, 'groupNames'> & { groups: string[] } }): Observable<UserModel> {
    return of({ ...params.user, groupNames: params.user.groups }).pipe(delay(this.delay));
  }

  public deleteUser$(_username: string): Observable<boolean> {
    return of(true).pipe(delay(this.delay));
  }

  public validatePasswordStrength$(_password: string): Observable<boolean> {
    return of(true).pipe(delay(this.delay));
  }

  public updateUser$(params: { username: string; user: Omit<UserModel, 'groupNames'> & { groups: string[] } }): Observable<UserModel> {
    return of({ ...params.user, groupNames: params.user.groups }).pipe(delay(this.delay));
  }

  public getApplications$(): Observable<ApplicationModel[]> {
    return of([mockData.getApplication()]).pipe(delay(this.delay));
  }

  public createApplication$(params: { application: Omit<ApplicationModel, 'id'> }): Observable<ApplicationModel> {
    return of({ ...params.application, id: '123' }).pipe(delay(this.delay));
  }

  public updateApplication$(params: { id: string; application: ApplicationModel }): Observable<ApplicationModel> {
    return of({ ...params.application }).pipe(delay(this.delay));
  }

  public deleteApplication$(_id: string): Observable<boolean> {
    return of(true).pipe(delay(this.delay));
  }

  public getConfig$(params: { key: string }): Observable<ConfigModel> {
    return of(mockData.getConfigModel({ key: params.key })).pipe(delay(this.delay));
  }

  public createConfig$(params: { config: ConfigModel }): Observable<ConfigModel> {
    return of({ ...params.config }).pipe(delay(this.delay));
  }

  public updateConfig$(params: { config: ConfigModel }): Observable<ConfigModel> {
    return of({ ...params.config }).pipe(delay(this.delay));
  }
  public getOIDCConfigurations$(): Observable<OIDCConfigurationModel[]> { return of([]).pipe(delay(this.delay)) }

  public createOIDCConfiguration$(params: { oidcConfiguration: Partial<Omit<OIDCConfigurationModel, 'id'>> }): Observable<OIDCConfigurationModel> {
      return null as any;
  }

  public updateOIDCConfiguration$(params: { id: number, oidcConfiguration: Partial<OIDCConfigurationModel> }): Observable<OIDCConfigurationModel> {
      return null as any;
  }

  public deleteOIDCConfiguration$(id: number): Observable<boolean> {
      return of(true).pipe(delay(this.delay));
  }
}
