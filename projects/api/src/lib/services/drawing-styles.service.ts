import { inject, Injectable } from '@angular/core';
import {
  DrawingFeatureModelAttributes,
} from '../../../../core/src/lib/components/drawing/models/drawing-feature.model';
import { map, Observable, of } from 'rxjs';
import { TAILORMAP_API_V1_SERVICE } from './tailormap-api-v1.service.injection-token';

@Injectable({
  providedIn: 'root',
})
export class DrawingStylesService {
  private apiService = inject(TAILORMAP_API_V1_SERVICE);

  private cachedResponse: DrawingFeatureModelAttributes[] | null = null;

  /**
   * Fetches the latest drawing styles from the API.
   * Returns an observable that emits an array of DrawingFeatureStyleModel.
   * If the API call fails, it returns an empty array.
   */
  public getDrawingStyles$(): Observable<DrawingFeatureModelAttributes[]> {
    if (this.cachedResponse) {
      return of(this.cachedResponse);
    } else {
      return this.apiService.getLatestUpload$('drawing-style')
        .pipe(
          map((response: any) => {
            if (Array.isArray(response?.styles)) {
              return this.cachedResponse = response.styles as DrawingFeatureModelAttributes[];
            }
            throw new Error('Invalid styles response format, expected an array');
          }),
        );
    }
  }
}
