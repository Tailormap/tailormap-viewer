import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { TailormapAdminApiV1ServiceModel } from './tailormap-admin-api-v1-service.model';
import * as mockData from '../mock-data/tailormap-admin-api.mock-data';
import { CatalogNodeModel } from '../models/catalog-node.model';
import { GeoServiceWithLayersModel } from '../models/geo-service-with-layers.model';

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

}
