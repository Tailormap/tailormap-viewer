import { Inject, Injectable } from '@angular/core';
import { AppResponseModel, TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';
import { catchError, map, Observable, of } from 'rxjs';

interface LoadApplicationResponse {
  success: boolean;
  error?: string;
  result?: {
    application: AppResponseModel;
  };
}

@Injectable({
  providedIn: 'root',
})
export class LoadApplicationService {

  private static LOAD_APPLICATION_ERROR = $localize `Could not find or load the requested application`;

  constructor(
    @Inject(TAILORMAP_API_V1_SERVICE) private apiService: TailormapApiV1ServiceModel,
  ) {
  }

  public loadApplication$(
    params?: { id?: number; name?: string; version?: string},
  ): Observable<LoadApplicationResponse> {
    return this.apiService.getApplication$(params || {})
      .pipe(
        catchError(() => {
          return of(LoadApplicationService.LOAD_APPLICATION_ERROR);
        }),
        map(LoadApplicationService.parseResponse),
      );
  }

  private static parseResponse(
    response: string | AppResponseModel,
  ): LoadApplicationResponse {
    if (typeof response === 'string') {
      return { success: false, error: response };
    }
    return {
      success: true,
      result: {
        application: response,
      },
    };
  }

}
