import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TailormapAdminApiV1ServiceModel } from './tailormap-admin-api-v1-service.model';
import { map, Observable } from 'rxjs';
import { CatalogNodeModel } from '../models/catalog-node.model';
import { GeoServiceWithLayersModel } from '../models/geo-service-with-layers.model';

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

}
