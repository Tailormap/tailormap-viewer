import { Injectable, inject } from '@angular/core';
import {
  DrawingFeatureModelAttributes } from '../../../map/models/drawing-feature.model';
import { map, Observable, shareReplay } from 'rxjs';
import { TAILORMAP_API_V1_SERVICE, UploadedImageHelper } from '@tailormap-viewer/api';
import { UploadedDrawingStylesResponse } from '../models/uploaded-drawing-styles.model';

@Injectable()
export class DrawingStylesService {
  private apiService = inject(TAILORMAP_API_V1_SERVICE);
  public getDrawingStyles$(): Observable<DrawingFeatureModelAttributes[]> {
    return this.apiService.getLatestUpload$<UploadedDrawingStylesResponse>(UploadedImageHelper.DRAWING_STYLE_CATEGORY)
      .pipe(
        map(response => response.styles),
        shareReplay(1), // Cache the response for subsequent subscribers
      );
  }
}
