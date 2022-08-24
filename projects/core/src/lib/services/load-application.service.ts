import { Inject, Injectable } from '@angular/core';
import { AppResponseModel, ComponentModel, TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';
import { catchError, concatMap, forkJoin, map, Observable, of } from 'rxjs';

interface LoadApplicationResponse {
  success: boolean;
  error?: string;
  result?: {
    application: AppResponseModel;
    components: ComponentModel[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class LoadApplicationService {

  private static LOAD_APPLICATION_ERROR = $localize `Could not find or load the requested application`;
  private static LOAD_COMPONENTS_ERROR = $localize `Could not load list of components`;

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
        concatMap((appResponse) => {
          if (typeof appResponse === 'string') {
            return of(appResponse);
          }
          return forkJoin([
            of(appResponse),
            this.apiService.getComponents$(appResponse.id)
              .pipe(catchError(() => of(LoadApplicationService.LOAD_COMPONENTS_ERROR))),
          ]);
        }),
        map(LoadApplicationService.parseResponse),
      );
  }

  private static parseResponse(
    response: string | [
        AppResponseModel,
        ComponentModel[] | string,
    ],
  ): LoadApplicationResponse {
    if (typeof response === 'string') {
      return { success: false, error: response };
    }
    const [ appResponse, components ] = response;
    if (typeof components === 'string') {
      return { success: false, error: components };
    }
    return {
      success: true,
      result: {
        application: appResponse,
        components,
      },
    };
  }

}
