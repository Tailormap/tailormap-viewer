import { Injectable, inject } from '@angular/core';
import { ViewerResponseModel, TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';
import { catchError, map, Observable, of } from 'rxjs';

interface LoadViewerResponse {
  success: boolean;
  error?: string;
  result?: {
    viewer: ViewerResponseModel;
  };
}

@Injectable({
  providedIn: 'root',
})
export class LoadViewerService {
  private apiService = inject<TailormapApiV1ServiceModel>(TAILORMAP_API_V1_SERVICE);


  private static LOAD_VIEWER_ERROR = $localize `:@@core.common.error-loading-viewer:Could not find or load the requested viewer`;

  public loadViewer$(id?: string): Observable<LoadViewerResponse> {
    return this.apiService.getViewer$(id)
      .pipe(
        catchError(() => {
          return of(LoadViewerService.LOAD_VIEWER_ERROR);
        }),
        map(LoadViewerService.parseResponse),
      );
  }

  private static parseResponse(
    response: string | ViewerResponseModel,
  ): LoadViewerResponse {
    if (typeof response === 'string') {
      return { success: false, error: response };
    }
    return {
      success: true,
      result: {
        viewer: response,
      },
    };
  }

}
