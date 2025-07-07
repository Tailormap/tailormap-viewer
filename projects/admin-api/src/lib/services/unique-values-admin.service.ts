import { Injectable } from '@angular/core';
import { UniqueValuesResponseModel } from '@tailormap-viewer/api';
import { catchError, Observable, of, tap } from 'rxjs';
import { TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';

export interface UniqueValueParams {
  applicationId: string;
  layerId: string;
  attribute: string;
  filter?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UniqueValuesAdminService {

  private currentApplicationId = '';
  private cachedResponses: Map<string, UniqueValuesResponseModel> = new Map();

  constructor(private adminApiService: TailormapAdminApiV1Service) { }

  public getUniqueValues$(params: UniqueValueParams): Observable<UniqueValuesResponseModel> {
    if (this.currentApplicationId !== params.applicationId) {
      // Clear the cache if we change applications
      this.cachedResponses = new Map();
    }
    this.currentApplicationId = params.applicationId;
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

  public createKey(params: UniqueValueParams): string {
    const key = [ params.applicationId, params.layerId, params.attribute ];
    if (params.filter) {
      key.push(params.filter);
    }
    return key.join('-');
  }

  public clearCaches(cacheKeys: string[]) {
    cacheKeys.forEach(key => {
      this.cachedResponses.delete(key);
    });
  }

}
