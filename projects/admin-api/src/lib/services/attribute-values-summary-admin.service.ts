import { Injectable, inject } from '@angular/core';
import { AttributeStatisticsResponseModel, UniqueValuesResponseModel } from '@tailormap-viewer/api';
import { catchError, Observable, of, tap } from 'rxjs';
import { TailormapAdminApiV1Service } from './tailormap-admin-api-v1.service';

export interface AttributeValuesSummaryAdminParams {
  featureTypeId: string;
  attribute: string;
  filter?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AttributeValuesSummaryAdminService {
  private adminApiService = inject(TailormapAdminApiV1Service);
  private cachedResponses: Map<string, UniqueValuesResponseModel> = new Map();
  private cachedStatisticsResponses: Map<string, AttributeStatisticsResponseModel> = new Map();

  public getUniqueValues$(params: AttributeValuesSummaryAdminParams): Observable<UniqueValuesResponseModel> {
    const key = this.createKey(params);
    const cachedResponse = this.cachedResponses.get(key);
    if (cachedResponse) {
      return of(cachedResponse);
    }
    return this.adminApiService.getUniqueValues$(params)
      .pipe(
        catchError(() => of({ hasError: true, filterApplied: false, values: [] })),
        tap((response: UniqueValuesResponseModel & { hasError?: boolean }) => {
          if (!response.hasError) {
            this.cachedResponses.set(key, response);
          }
        }),
      );
  }

  public getAttributeStatistics$(params: AttributeValuesSummaryAdminParams): Observable<AttributeStatisticsResponseModel> {
    const key = this.createKey(params);
    const cachedResponse = this.cachedStatisticsResponses.get(key);
    if (cachedResponse) {
      return of(cachedResponse);
    }
    return this.adminApiService.getAttributeStatistics$(params)
      .pipe(
        catchError(() => of({ hasError: true, filterApplied: false, min: null, max: null, count: 0, sum: 0, avg: 0 })),
        tap((response: AttributeStatisticsResponseModel & { hasError?: boolean }) => {
          if (!response.hasError) {
            this.cachedStatisticsResponses.set(key, response);
          }
        }),
      );
  }

  public createKey(params: AttributeValuesSummaryAdminParams): string {
    const key = [ params.featureTypeId, params.attribute ];
    if (params.filter) {
      key.push(params.filter);
    }
    return key.join('-');
  }

  public clearCache() {
    this.cachedResponses = new Map();
    this.cachedStatisticsResponses = new Map();
  }

}
