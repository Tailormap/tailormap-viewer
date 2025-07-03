import { Inject, Injectable } from '@angular/core';
import {
  DrawingFeatureModelAttributes } from '../models/drawing-feature.model';
import { map, Observable, shareReplay } from 'rxjs';
import { TAILORMAP_API_V1_SERVICE } from '../../../../../../api/src/lib/services/tailormap-api-v1.service.injection-token';
import { TailormapApiV1ServiceModel } from '../../../../../../api/src/lib/services/tailormap-api-v1.service.model';
import { UploadedDrawingStylesResponse } from '../models/uploaded-drawing-styles.model';

@Injectable({
  providedIn: 'root',
})
export class DrawingStylesService {
  constructor(@Inject(TAILORMAP_API_V1_SERVICE) private apiService: TailormapApiV1ServiceModel) {
  }

  public getDrawingStyles$(): Observable<DrawingFeatureModelAttributes[]> {
    return this.apiService.getLatestUpload$<UploadedDrawingStylesResponse>('drawing-style')
      .pipe(
        map(response => response.styles),
        shareReplay(1), // Cache the response for subsequent subscribers
      );
  }
}
