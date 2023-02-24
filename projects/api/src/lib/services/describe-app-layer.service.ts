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

  public getDescribeAppLayer$(applicationId: string, layerName: string): Observable<LayerDetailsModel> {
    const cachedDetails = this.cachedDetails.get(this.getCacheKey(applicationId, layerName));
    if (cachedDetails) {
      return of(cachedDetails);
    }
    return this.apiService.getDescribeLayer$({ applicationId, layerName })
      .pipe(tap((details) => this.cachedDetails.set(this.getCacheKey(applicationId, layerName), details)));
  }

  private getCacheKey(applicationId: string, layerName: string) {
    return `${applicationId}-${layerName}`;
  }

}
