import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { TailormapAdminApiV1ServiceModel } from './tailormap-admin-api-v1-service.model';
import { catchError, map, Observable, of } from 'rxjs';
import {
  CatalogNodeModel, GeoServiceModel, GeoServiceWithLayersModel, GroupModel, FeatureSourceModel, UserModel, ApplicationModel, ConfigModel,
  OIDCConfigurationModel, FeatureTypeModel,
  GeoServiceSummaryWithLayersModel, FeatureSourceSummaryWithFeatureTypesModel, FormSummaryModel, FormModel, UploadModel, SearchIndexModel,
  SearchIndexPingResponseModel, TaskModel, TaskDetailsModel,
} from '../models';
import { CatalogModelHelper } from '../helpers/catalog-model.helper';
import { ApiHelper, TailormapApiConstants } from '@tailormap-viewer/api';

type GeoServiceListResponse = { _embedded: { ['geo-services']: GeoServiceSummaryWithLayersModel[] }};
type FeatureSourceListResponse = { _embedded: { ['feature-sources']: FeatureSourceSummaryWithFeatureTypesModel[] }};

@Injectable({
  providedIn: 'root',
})
export class TailormapAdminApiV1Service implements TailormapAdminApiV1ServiceModel {

  public static BASE_URL = `${TailormapApiConstants.BASE_URL}/admin`;

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

  public getGeoServiceSummaries$(): Observable<GeoServiceSummaryWithLayersModel[]> {
    return this.httpClient.get<GeoServiceListResponse>(`${TailormapAdminApiV1Service.BASE_URL}/geo-services?projection=summary&size=1000`)
      .pipe(map(response => (response?._embedded['geo-services'] || []).map(CatalogModelHelper.addTypeToGeoServiceSummaryModel)));
  }

  public getGeoService$(params: { id: string }): Observable<GeoServiceWithLayersModel> {
    return this.httpClient.get<GeoServiceWithLayersModel>(`${TailormapAdminApiV1Service.BASE_URL}/geo-services/${params.id}`)
      .pipe(map(CatalogModelHelper.addTypeToGeoServiceModel));
  }

  public createGeoService$(params: { geoService: Omit<GeoServiceModel, 'id' | 'type'>; refreshCapabilities?: boolean}): Observable<GeoServiceWithLayersModel> {
    return this.httpClient.post<GeoServiceWithLayersModel>(
      `${TailormapAdminApiV1Service.BASE_URL}/geo-services`,
      {
        ...params.geoService,
        refreshCapabilities: !!params.refreshCapabilities,
      },
    ).pipe(map(CatalogModelHelper.addTypeToGeoServiceModel));
  }

  public updateGeoService$(params: { id: string; geoService: Omit<Partial<GeoServiceModel>, 'type'>; refreshCapabilities?: boolean }): Observable<GeoServiceWithLayersModel> {
    return this.httpClient.patch<GeoServiceWithLayersModel>(
      `${TailormapAdminApiV1Service.BASE_URL}/geo-services/${params.id}`,
      {
        ...params.geoService,
        refreshCapabilities: !!params.refreshCapabilities,
      },
    ).pipe(map(CatalogModelHelper.addTypeToGeoServiceModel));
  }

  public deleteGeoService$(params: { id: string }): Observable<boolean> {
    return this.httpClient.delete<boolean>(`${TailormapAdminApiV1Service.BASE_URL}/geo-services/${params.id}`, {
      observe: 'response',
    }).pipe(
      map(response => response.status === 204),
    );
  }

  public refreshGeoService$(params: { id: string }): Observable<GeoServiceWithLayersModel> {
    return this.httpClient.post<GeoServiceWithLayersModel>(`${TailormapAdminApiV1Service.BASE_URL}/geo-services/${params.id}/refresh-capabilities`, {})
      .pipe(map(CatalogModelHelper.addTypeToGeoServiceModel));
  }

  public getFeatureSourceSummaries$(): Observable<FeatureSourceSummaryWithFeatureTypesModel[]> {
    return this.httpClient.get<FeatureSourceListResponse>(
      `${TailormapAdminApiV1Service.BASE_URL}/feature-sources?projection=summary&size=1000`,
    )
      .pipe(map(response => (response?._embedded['feature-sources'] || []).map(CatalogModelHelper.addTypeAndFeatureTypesToFeatureSourceSummaryModel)));
  }

  public getFeatureSource$(params: { id: string }): Observable<FeatureSourceModel> {
    return this.httpClient.get<FeatureSourceModel>(`${TailormapAdminApiV1Service.BASE_URL}/feature-sources/${params.id}`)
      .pipe(map(CatalogModelHelper.addTypeAndFeatureTypesToFeatureSourceModel));
  }

  public createFeatureSource$(params: { featureSource: Omit<FeatureSourceModel, 'id' | 'type' | 'featureTypes'>; refreshCapabilities?: boolean }): Observable<FeatureSourceModel> {
    return this.httpClient.post<FeatureSourceModel>(
      `${TailormapAdminApiV1Service.BASE_URL}/feature-sources`,
      {
        ...params.featureSource,
        refreshCapabilities: !!params.refreshCapabilities,
      },
    ).pipe(map(CatalogModelHelper.addTypeAndFeatureTypesToFeatureSourceModel));
  }

  public updateFeatureSource$(
    params: {
      id: string;
      featureSource: Omit<Partial<FeatureSourceModel>, 'type' | 'featureTypes'>;
      refreshCapabilities?: boolean;
    },
  ): Observable<FeatureSourceModel> {
    return this.httpClient.patch<FeatureSourceModel>(
      `${TailormapAdminApiV1Service.BASE_URL}/feature-sources/${params.id}`,
      {
        ...params.featureSource,
        refreshCapabilities: !!params.refreshCapabilities,
      },
    ).pipe(map(CatalogModelHelper.addTypeAndFeatureTypesToFeatureSourceModel));
  }

  public deleteFeatureSource$(params: { id: string }): Observable<boolean> {
    return this.httpClient.delete<boolean>(`${TailormapAdminApiV1Service.BASE_URL}/feature-sources/${params.id}`, {
      observe: 'response',
    }).pipe(
      map(response => response.status === 204),
    );
  }

  public refreshFeatureSource$(params: { id: string }): Observable<FeatureSourceModel> {
    return this.httpClient.post<FeatureSourceModel>(`${TailormapAdminApiV1Service.BASE_URL}/feature-sources/${params.id}/refresh-capabilities`, {})
      .pipe(map(CatalogModelHelper.addTypeAndFeatureTypesToFeatureSourceModel));
  }

  public getFeatureType$(params: { id: string }): Observable<FeatureTypeModel> {
    return this.httpClient.get<FeatureTypeModel>(`${TailormapAdminApiV1Service.BASE_URL}/feature-types/${params.id}`);
  }

  public updateFeatureType$(params: { id: string; featureType: Pick<Partial<FeatureTypeModel>, 'title' | 'comment' | 'settings'> }): Observable<FeatureTypeModel> {
    return this.httpClient.patch<FeatureTypeModel>(
      `${TailormapAdminApiV1Service.BASE_URL}/feature-types/${params.id}`,
      params.featureType,
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
  public getUser$(username: string, projection = 'groupName'): Observable<UserModel> {
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

  public createUser$(params: { user: Omit<UserModel, 'groupNames'> & { groups: string[] } }): Observable<UserModel> {
    return this.httpClient.post<UserModel>(`${TailormapAdminApiV1Service.BASE_URL}/users`, params.user);
  }

  public updateUser$(params: { username: string; user: Partial<Omit<UserModel, 'groupNames'> & { groups: string[] }> }): Observable<UserModel> {
    return this.httpClient.patch<UserModel>(`${TailormapAdminApiV1Service.BASE_URL}/users/${params.username}`, params.user);
  }

  public deleteUser$(username: string): Observable<boolean> {
    return this.httpClient.delete<boolean>(`${TailormapAdminApiV1Service.BASE_URL}/users/${username}`, {
      observe: 'response',
    }).pipe(
      map(response => response.status === 204),
    );
  }

  public validatePasswordStrength$(password: string): Observable<boolean> {
    const body = new HttpParams().set('password', password);
    return this.httpClient.post<{ result: boolean }>(`${TailormapAdminApiV1Service.BASE_URL}/validate-password`, body)
      .pipe(map(response => response.result));
  }

  public getApplications$(): Observable<ApplicationModel[]> {
    return this.httpClient.get<{ _embedded: { applications: ApplicationModel[] }}>(`${TailormapAdminApiV1Service.BASE_URL}/applications?size=1000&sort=title`)
      .pipe(map(response => response._embedded.applications));
  }

  public createApplication$(params: { application: Partial<Omit<ApplicationModel, 'id'>> }): Observable<ApplicationModel> {
    return this.httpClient.post<ApplicationModel>(`${TailormapAdminApiV1Service.BASE_URL}/applications`, params.application);
  }

  public updateApplication$(params: { id: string; application: Partial<ApplicationModel> }): Observable<ApplicationModel> {
    return this.httpClient.patch<ApplicationModel>(`${TailormapAdminApiV1Service.BASE_URL}/applications/${params.id}`, params.application);
  }

  public deleteApplication$(id: string): Observable<boolean> {
    return this.httpClient.delete<boolean>(`${TailormapAdminApiV1Service.BASE_URL}/applications/${id}`, {
      observe: 'response',
    }).pipe(
      map(response => response.status === 204),
    );
  }

  public getConfig$(params: { key: string }): Observable<ConfigModel> {
    return this.httpClient.get<ConfigModel>(`${TailormapAdminApiV1Service.BASE_URL}/configs/${params.key}`);
  }

  public createConfig$(params: { config: ConfigModel }): Observable<ConfigModel> {
    return this.httpClient.post<ConfigModel>(`${TailormapAdminApiV1Service.BASE_URL}/configs`, params.config);
  }

  public updateConfig$(params: { config: ConfigModel }): Observable<ConfigModel> {
    return this.httpClient.patch<ConfigModel>(`${TailormapAdminApiV1Service.BASE_URL}/configs/${params.config.key}`, params.config);
  }

  public getOIDCConfigurations$(): Observable<OIDCConfigurationModel[]> {
    return this.httpClient.get<{ _embedded: { 'oidc-configurations': OIDCConfigurationModel[] }}>(`${TailormapAdminApiV1Service.BASE_URL}/oidc-configurations?size=1000&sort=id`)
      .pipe(map(response => response._embedded['oidc-configurations']));
  }

  public createOIDCConfiguration$(params: { oidcConfiguration: Omit<OIDCConfigurationModel, 'id'> }): Observable<OIDCConfigurationModel> {
    return this.httpClient.post<OIDCConfigurationModel>(`${TailormapAdminApiV1Service.BASE_URL}/oidc-configurations`, params.oidcConfiguration);
  }

  public updateOIDCConfiguration$(params: { id: number; oidcConfiguration: Partial<OIDCConfigurationModel> }): Observable<OIDCConfigurationModel> {
    return this.httpClient.patch<OIDCConfigurationModel>(`${TailormapAdminApiV1Service.BASE_URL}/oidc-configurations/${params.id}`, params.oidcConfiguration);
  }

  public deleteOIDCConfiguration$(id: number): Observable<boolean> {
    return this.httpClient.delete<boolean>(`${TailormapAdminApiV1Service.BASE_URL}/oidc-configurations/${id}`, {
      observe: 'response',
    }).pipe(
      map(response => response.status === 204),
    );
  }

  public getForms$(): Observable<FormSummaryModel[]> {
    return this.httpClient.get<{ _embedded: { 'forms': FormSummaryModel[] }}>(`${TailormapAdminApiV1Service.BASE_URL}/forms?projection=summary&size=1000`)
      .pipe(map(response => response._embedded['forms']));
  }

  public getForm$(id: number): Observable<FormModel> {
    return this.httpClient.get<FormModel>(`${TailormapAdminApiV1Service.BASE_URL}/forms/${id}`);
  }

  public createForm$(params: { form: Omit<FormModel, 'id'> }): Observable<FormModel> {
    return this.httpClient.post<FormModel>(`${TailormapAdminApiV1Service.BASE_URL}/forms`, params.form);
  }

  public updateForm$(params: { id: number; form: Partial<FormModel> }): Observable<FormModel> {
    return this.httpClient.patch<FormModel>(`${TailormapAdminApiV1Service.BASE_URL}/forms/${params.id}`, params.form);
  }

  public deleteForm$(id: number): Observable<boolean> {
    return this.httpClient.delete<boolean>(`${TailormapAdminApiV1Service.BASE_URL}/forms/${id}`, {
      observe: 'response',
    }).pipe(
      map(response => response.status === 204),
    );
  }

  public getUploads$(category?: string): Observable<UploadModel[]> {
    let url = `${TailormapAdminApiV1Service.BASE_URL}/uploads`;
    const params: { category?: string } = {};
    if (category) {
      url = `${url}/search/findByCategory`;
      params.category = category;
    }
    url = `${url}?projection=summary`;
    return this.httpClient.get<{ _embedded: { uploads: UploadModel[] }}>(url, { params }).pipe(
      map(response => response._embedded.uploads),
    );
  }

  public createUpload$(upload: Pick<UploadModel, 'content' | 'filename' | 'category' | 'mimeType'>): Observable<UploadModel> {
    return this.httpClient.post<UploadModel>(`${TailormapAdminApiV1Service.BASE_URL}/uploads`, upload).pipe(
      map(response => response),
    );
  }

  public deleteUpload$(uploadId: string): Observable<boolean> {
    return this.httpClient.delete(`${TailormapAdminApiV1Service.BASE_URL}/uploads/${uploadId}`, {
      observe: 'response',
    }).pipe(
      map(response => response.status === 204),
    );
  }

  // sha1 hashes are used to identify uploads
  public findUploadsByHash$(category: string, hashes: string[]): Observable<{ id: string; hash: string }[]> {
    return this.httpClient.post<{ id: string; hash: string }[]>(`${TailormapAdminApiV1Service.BASE_URL}/uploads/find-by-hash/${category}`, hashes);
  }

  public pingSearchIndexEngine$(): Observable<SearchIndexPingResponseModel> {
    return this.httpClient.get<{ status: string }>(`${TailormapAdminApiV1Service.BASE_URL}/index/ping`).pipe(
      map(response => ({ success: true, ...response })),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 500 && ApiHelper.isApiErrorResponse(err.error)) {
          return of({ success: false, ...err.error });
        } else {
          return of({ success: false, code: err.status, message: err.statusText });
        }
      }),
    );
  }

  public getSearchIndexes$(): Observable<SearchIndexModel[]> {
    return this.httpClient.get<{ _embedded: { 'search-indexes': SearchIndexModel[] }}>(`${TailormapAdminApiV1Service.BASE_URL}/search-indexes?size=1000`)
      .pipe(map(response => response._embedded['search-indexes']));
  }

  public createSearchIndex$(params: { searchIndex: Omit<SearchIndexModel, 'id'> }): Observable<SearchIndexModel> {
    return this.httpClient.post<SearchIndexModel>(`${TailormapAdminApiV1Service.BASE_URL}/search-indexes`, params.searchIndex);
  }

  public updateSearchIndex$(params: { id: number; searchIndex: Partial<SearchIndexModel> }): Observable<SearchIndexModel> {
    return this.httpClient.patch<SearchIndexModel>(`${TailormapAdminApiV1Service.BASE_URL}/search-indexes/${params.id}`, params.searchIndex);
  }

  public deleteSearchIndex$(id: number): Observable<boolean> {
    return this.httpClient.delete<boolean>(`${TailormapAdminApiV1Service.BASE_URL}/search-indexes/${id}`, {
      observe: 'response',
    }).pipe(
      map(response => response.status === 204),
    );
  }

  public reindexSearchIndex$(id: number): Observable<boolean> {
    return this.httpClient.put(`${TailormapAdminApiV1Service.BASE_URL}/index/${id}`, {}, {
      observe: 'response',
    }).pipe(
      map(response => {
        return response.status === 201 || response.status === 202;
      }),
      catchError(() => of(false)),
    );
  }

  public clearSearchIndex$(id: number): Observable<boolean> {
    return this.httpClient.delete(`${TailormapAdminApiV1Service.BASE_URL}/index/${id}`, {
      observe: 'response',
    }).pipe(
      map(response => {
        return response.status === 204;
      }),
      catchError(() => of(false)),
    );
  }

  public getTasks$(): Observable<TaskModel[]> {
    return this.httpClient.get<{ 'tasks': TaskModel[] }>(`${TailormapAdminApiV1Service.BASE_URL}/tasks`)
      .pipe(map(response => response.tasks));
  }

  public getTaskDetails$(uuid: string, type: string): Observable<TaskDetailsModel> {
    return this.httpClient.get<TaskDetailsModel>(`${TailormapAdminApiV1Service.BASE_URL}/tasks/${type}/${uuid}`);
  }

  public deleteTask$(uuid: string, type: string): Observable<boolean> {
    return this.httpClient.delete<boolean>(`${TailormapAdminApiV1Service.BASE_URL}/tasks/${type}/${uuid}`, {
      observe: 'response',
    }).pipe(
      map(response => response.status === 204),
    );
  }

  public startTask$(uuid: string, type: string): Observable<boolean> {
    return this.httpClient.put(`${TailormapAdminApiV1Service.BASE_URL}/tasks/${type}/${uuid}/start`, {}, {
      observe: 'response',
    }).pipe(
      map(response => response.status === 202),
      catchError(() => of(false)),
    );
  }

  public stopTask$(uuid: string, type: string): Observable<boolean> {
    return this.httpClient.put(`${TailormapAdminApiV1Service.BASE_URL}/tasks/${type}/${uuid}/stop`, {}, {
      observe: 'response',
    }).pipe(
      map(response => response.status === 202),
      catchError(() => of(false)),
    );
  }

}
