import { inject, Injectable } from '@angular/core';
import { TAILORMAP_API_V1_SERVICE } from '../services';
import { UniqueValuesResponseModel } from '../models/unique-values-response.model';
import { catchError, Observable, of, tap } from 'rxjs';

export interface UniqueValueParams {
  applicationId: string;
  layerId: string;
  attribute: string;
  filter?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UniqueValuesService {

  private currentApplicationId = '';
  private apiService = inject(TAILORMAP_API_V1_SERVICE);

  private cachedResponses: Map<string, UniqueValuesResponseModel> = new Map();

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
    return this.apiService.getUniqueValues$(params)
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
