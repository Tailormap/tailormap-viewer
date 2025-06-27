import { Injectable } from '@angular/core';
import { DrawingFeatureStyleModel } from './models/drawing-feature.model';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { TailormapApiConstants } from '@tailormap-viewer/api';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DrawingStylesService {

  constructor(private httpClient: HttpClient) {
  }

  public getDrawingStyle$(): Observable<DrawingFeatureStyleModel[]> {
    return this.httpClient.get(`${TailormapApiConstants.BASE_URL}/uploads/drawing-style/latest`)
      .pipe(
        catchError(() => of([])),
        tap(response => console.debug('Received drawing styles:', response)),
        // map the response styles object to DrawingFeatureStyleModel[]
        map((response: any) => Array.isArray(response?.styles) ? response.styles as DrawingFeatureStyleModel[] : []));
  }
}
