import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TailormapAdminApiV1ServiceModel } from './tailormap-admin-api-v1-service.model';
import { map, Observable } from 'rxjs';
import { CatalogNodeModel } from '../models/catalog-node.model';
import { GeoServiceWithLayersModel } from '../models/geo-service-with-layers.model';
import { GeoServiceModel } from '../models';

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

  public getGeoService$(params: { id: string }): Observable<GeoServiceWithLayersModel> {
    return this.httpClient.get<GeoServiceWithLayersModel>(`${TailormapAdminApiV1Service.BASE_URL}/geo-services/${params.id}`);
  }

  public updateCatalog$(nodes: CatalogNodeModel[]): Observable<CatalogNodeModel[]> {
    return this.httpClient.put<{ nodes: CatalogNodeModel[] }>(`${TailormapAdminApiV1Service.BASE_URL}/catalogs/main`, {
      nodes,
    }).pipe(map(response => response.nodes));
  }

  public createGeoService$(params: { geoService: Omit<GeoServiceModel, 'id'> }): Observable<GeoServiceWithLayersModel> {
    return this.httpClient.post<GeoServiceWithLayersModel>(`${TailormapAdminApiV1Service.BASE_URL}/geo-services`, params.geoService);
  }

  public updateGeoService$(params: { id: string; geoService: GeoServiceModel }): Observable<GeoServiceWithLayersModel> {
    return this.httpClient.patch<GeoServiceWithLayersModel>(`${TailormapAdminApiV1Service.BASE_URL}/geo-services/${params.id}`, params.geoService);
  }

  public deleteGeoService$(params: { id: string }): Observable<boolean> {
    return this.httpClient.delete<boolean>(`${TailormapAdminApiV1Service.BASE_URL}/geo-services/${params.id}`, {
      observe: 'response',
    }).pipe(
      map(response => response.status === 204),
    );
  }

}
