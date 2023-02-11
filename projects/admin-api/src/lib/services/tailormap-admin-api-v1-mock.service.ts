import { Injectable } from '@angular/core';
import { GeoServiceModel } from '../models';
import { delay, Observable, of } from 'rxjs';
import { TailormapAdminApiV1ServiceModel } from './tailormap-admin-api-v1-service.model';
import * as mockData from '../mock-data/tailormap-admin-api.mock-data';
import { CatalogNodeModel } from '../models/catalog-node.model';

@Injectable()
export class TailormapAdminApiV1MockService implements TailormapAdminApiV1ServiceModel {

  public delay = 3000;

  public getCatalog$(): Observable<CatalogNodeModel[]> {
    return of(mockData.getCatalogTree()).pipe(delay(this.delay));
  }

  public getGeoService$(params: { id: number }): Observable<GeoServiceModel> {
    return of(mockData.getGeoService({
      id: `${params.id}`,
      title: 'Service ' + params.id,
    })).pipe(delay(this.delay));
  }

}
