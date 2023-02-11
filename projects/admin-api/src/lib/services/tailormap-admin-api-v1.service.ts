import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TailormapAdminApiV1ServiceModel } from './tailormap-admin-api-v1-service.model';
import { Observable } from 'rxjs';
import { GeoServiceModel } from '../models';
import { CatalogNodeModel } from '../models/catalog-node.model';

@Injectable()
export class TailormapAdminApiV1Service implements TailormapAdminApiV1ServiceModel {

  public static BASE_URL = '/api/admin';

  constructor(
    private httpClient: HttpClient,
  ) {
  }

  public getCatalog$(): Observable<CatalogNodeModel[]> {
    return this.httpClient.get<CatalogNodeModel[]>(`${TailormapAdminApiV1Service.BASE_URL}/catalog`);
  }

  public getGeoService$(params: { id: string | number }): Observable<GeoServiceModel> {
    return this.httpClient.get<GeoServiceModel>(`${TailormapAdminApiV1Service.BASE_URL}/geo-service/${params.id}`);
  }

}
