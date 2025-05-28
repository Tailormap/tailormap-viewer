import { inject, Injectable } from '@angular/core';
import { TailormapApiV1ServiceModel } from './tailormap-api-v1.service.model';
import { TAILORMAP_API_V1_SERVICE } from './tailormap-api-v1.service.injection-token';
import { LayerDetailsModel } from '../models';
import { Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DescribeAppLayerService {

  private cachedDetails: Map<string, LayerDetailsModel> = new Map();
  private apiService = inject<TailormapApiV1ServiceModel>(TAILORMAP_API_V1_SERVICE);

  public getDescribeAppLayer$(applicationId: string | null, layerId: string): Observable<LayerDetailsModel> {
    if (!applicationId) {
      throw new Error('Application ID must be provided to describe a layer');
    }
    const cachedDetails = this.cachedDetails.get(this.getCacheKey(applicationId, layerId));
    if (cachedDetails) {
      return of(cachedDetails);
    }
    return this.apiService.getDescribeLayer$({ applicationId, layerId })
      .pipe(tap((details) => this.cachedDetails.set(this.getCacheKey(applicationId, layerId), details)));
  }

  private getCacheKey(applicationId: string, layerId: string) {
    return `${applicationId}-${layerId}`;
  }

}
