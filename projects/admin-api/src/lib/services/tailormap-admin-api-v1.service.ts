import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TailormapAdminApiV1ServiceModel } from './tailormap-admin-api-v1-service.model';
import { map, Observable } from 'rxjs';
import { CatalogNodeModel, GeoServiceModel, GeoServiceWithLayersModel, GroupModel, FeatureSourceModel, UserModel } from '../models';
import { CatalogModelHelper } from '../helpers/catalog-model.helper';

@Injectable()
export class TailormapAdminApiV1Service implements TailormapAdminApiV1ServiceModel {

  public static BASE_URL = '/api/admin';

  constructor(
    private httpClient: HttpClient,
  ) {
  }

  public getCatalog$(): Observable<CatalogNodeModel[]> {
    return this.httpClient.get<{ nodes: CatalogNodeModel[] }>(`${TailormapAdminApiV1Service.BASE_URL}/catalogs/main`)
      .pipe(map(response => response.nodes));
  }

  public updateCatalog$(nodes: CatalogNodeModel[]): Observable<CatalogNodeModel[]> {
    return this.httpClient.put<{ nodes: CatalogNodeModel[] }>(`${TailormapAdminApiV1Service.BASE_URL}/catalogs/main`, {
      nodes,
    }).pipe(map(response => response.nodes));
  }

  public getGeoService$(params: { id: string }): Observable<GeoServiceWithLayersModel> {
    return this.httpClient.get<GeoServiceWithLayersModel>(`${TailormapAdminApiV1Service.BASE_URL}/geo-services/${params.id}`)
      .pipe(map(CatalogModelHelper.addTypeToGeoServiceModel));
  }

  public createGeoService$(params: { geoService: Omit<GeoServiceModel, 'id'> }): Observable<GeoServiceWithLayersModel> {
    return this.httpClient.post<GeoServiceWithLayersModel>(`${TailormapAdminApiV1Service.BASE_URL}/geo-services`, params.geoService)
      .pipe(map(CatalogModelHelper.addTypeToGeoServiceModel));
  }

  public updateGeoService$(params: { id: string; geoService: GeoServiceModel }): Observable<GeoServiceWithLayersModel> {
    return this.httpClient.patch<GeoServiceWithLayersModel>(`${TailormapAdminApiV1Service.BASE_URL}/geo-services/${params.id}`, params.geoService)
      .pipe(map(CatalogModelHelper.addTypeToGeoServiceModel));
  }

  public deleteGeoService$(params: { id: string }): Observable<boolean> {
    return this.httpClient.delete<boolean>(`${TailormapAdminApiV1Service.BASE_URL}/geo-services/${params.id}`, {
      observe: 'response',
    }).pipe(
      map(response => response.status === 204),
    );
  }

  public getFeatureSource$(params: { id: string }): Observable<FeatureSourceModel> {
    return this.httpClient.get<FeatureSourceModel>(`${TailormapAdminApiV1Service.BASE_URL}/feature-sources/${params.id}`)
      .pipe(map(CatalogModelHelper.addTypeToFeatureSourceModel));
  }
  public createFeatureSource$(params: { featureSource: Omit<FeatureSourceModel, 'id'> }): Observable<FeatureSourceModel> {
    return this.httpClient.post<FeatureSourceModel>(`${TailormapAdminApiV1Service.BASE_URL}/feature-sources`, params.featureSource)
      .pipe(map(CatalogModelHelper.addTypeToFeatureSourceModel));
  }

  public updateFeatureSource$(params: { id: string; featureSource: FeatureSourceModel }): Observable<FeatureSourceModel> {
    return this.httpClient.patch<FeatureSourceModel>(`${TailormapAdminApiV1Service.BASE_URL}/feature-sources/${params.id}`, params.featureSource)
      .pipe(map(CatalogModelHelper.addTypeToFeatureSourceModel));
  }

  public deleteFeatureSource$(params: { id: string }): Observable<boolean> {
    return this.httpClient.delete<boolean>(`${TailormapAdminApiV1Service.BASE_URL}/feature-sources/${params.id}`, {
      observe: 'response',
    }).pipe(
      map(response => response.status === 204),
    );
  }

    public getGroups$(): Observable<GroupModel[]> {
    return this.httpClient.get<any>(`${TailormapAdminApiV1Service.BASE_URL}/groups?size=1000&sort=name`)
      .pipe(map(response => response._embedded.groups));
  }

  public getGroup$(username: string): Observable<GroupModel> {
    return this.httpClient.get<any>(`${TailormapAdminApiV1Service.BASE_URL}/groups/${username}`);
  }

  public createGroup$(params: { group: GroupModel }): Observable<GroupModel> {
    return this.httpClient.post<GroupModel>(`${TailormapAdminApiV1Service.BASE_URL}/groups`, params.group);
  }

  public updateGroup$(params: { name: string; group: Partial<GroupModel> }): Observable<GroupModel> {
    return this.httpClient.patch<GroupModel>(`${TailormapAdminApiV1Service.BASE_URL}/groups/${params.name}`, params.group);
  }

  public deleteGroup$(name: string): Observable<boolean> {
    return this.httpClient.delete<boolean>(`${TailormapAdminApiV1Service.BASE_URL}/groups/${name}`, {
      observe: 'response',
    }).pipe(
      map(response => response.status === 204),
    );
  }

  public getUsers$(): Observable<UserModel[]> {
    return this.httpClient.get<any>(`${TailormapAdminApiV1Service.BASE_URL}/users?size=1000&sort=username`)
      .pipe(map(response => response._embedded.users));
  }

  /**
   * Get a user by username, the projection is set to `groupName` by default to get only the group names.
   *
   * @param username an existing username
   * @param projection the projection to use, default is `groupName`
   */
  public getUser$(username: string, projection: string='groupName'): Observable<UserModel> {
    return this.httpClient.get<any>(`${TailormapAdminApiV1Service.BASE_URL}/users/${username}?projection=${projection}`, {
      observe: 'response',
    }).pipe(
      map(response => {
          const user = response.body;
          user.groups = response.body?._embedded?.groups;
          if (user.validUntil) {
            // parse json response into date object
            user.validUntil = new Date(user.validUntil);
          }
          return user;
      }),
    );
  }

  public createUser$(params: { user: UserModel }): Observable<UserModel> {
    return this.httpClient.post<UserModel>(`${TailormapAdminApiV1Service.BASE_URL}/users`, params.user);
  }

  public updateUser$(params: { username: string; user: Partial<UserModel> }): Observable<UserModel> {
    return this.httpClient.patch<UserModel>(`${TailormapAdminApiV1Service.BASE_URL}/users/${params.username}`, params.user);
  }

  public deleteUser$(username: string): Observable<boolean> {
    return this.httpClient.delete<boolean>(`${TailormapAdminApiV1Service.BASE_URL}/users/${username}`, {
      observe: 'response',
    }).pipe(
      map(response => response.status === 204),
    );
  }

}
