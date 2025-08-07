import { Injectable, signal, inject } from '@angular/core';
import {
  DrawingFeatureModelAttributes } from '../models/drawing-feature.model';
import { map, Observable, shareReplay } from 'rxjs';
import { TAILORMAP_API_V1_SERVICE, UploadedImageHelper } from '@tailormap-viewer/api';
import { TailormapApiV1ServiceModel } from '@tailormap-viewer/api';
import { UploadedDrawingStylesResponse } from '../models/uploaded-drawing-styles.model';

@Injectable({
  providedIn: 'root',
})
export class DrawingStylesService {
  private apiService = inject<TailormapApiV1ServiceModel>(TAILORMAP_API_V1_SERVICE);


  public selectedDrawingStyle = signal<number | null>(null);

  public getDrawingStyles$(): Observable<DrawingFeatureModelAttributes[]> {
    return this.apiService.getLatestUpload$<UploadedDrawingStylesResponse>(UploadedImageHelper.DRAWING_STYLE_CATEGORY)
      .pipe(
        map(response => response.styles),
        shareReplay(1), // Cache the response for subsequent subscribers
      );
  }

  public setSelectedDrawingStyle(idx: number | null) {
    this.selectedDrawingStyle.set(idx);
  }

}
