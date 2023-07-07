import { Inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FeatureModel, TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { HttpStatusCode } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EditFeatureService {

  constructor(
    private snackBar: MatSnackBar,
    @Inject(TAILORMAP_API_V1_SERVICE) private api: TailormapApiV1ServiceModel,
  ) {
  }

  private showSnackbarMessage(msg: string) {
    const config: SnackBarMessageOptionsModel = {
      message: msg,
      duration: 5000,
      showDuration: true,
      showCloseButton: true,
    };
    SnackBarMessageComponent.open$(this.snackBar, config).subscribe();
  }

  public deleteFeature$(applicationId: string, layerId: string, feature: FeatureModel): Observable<boolean> {
    return this.api.deleteFeature$({ applicationId, layerId, feature }).pipe(
      catchError((_e) => {
        this.showSnackbarMessage($localize `Delete feature failed`);
        return of(HttpStatusCode.InternalServerError);
      }),
      map((result) => result === HttpStatusCode.Ok || result === HttpStatusCode.NoContent),
      tap((result) => {
        if (result) {
          this.showSnackbarMessage($localize`Feature deleted`);
        }
      }),
    );
  }

  public updateFeature$(applicationId: string, layerId: string, feature: FeatureModel): Observable<FeatureModel | null> {
    return this.api.updateFeature$({ applicationId, layerId, feature }).pipe(
      catchError((_e) => {
        this.showSnackbarMessage($localize `Update feature failed`);
        return of(null);
      }),
      tap(result => {
        if (result) {
          this.showSnackbarMessage($localize `Feature updated`);
        }
      }),
    );
  }

  public createFeature$(applicationId: string, layerId: string, feature: FeatureModel): Observable<FeatureModel | null> {
    return this.api.createFeature$({ applicationId, layerId, feature }).pipe(
      catchError((_e) => {
        this.showSnackbarMessage($localize `Create feature failed`);
        return of(null);
      }),
      tap(result => {
        if (result) {
          this.showSnackbarMessage($localize `Feature created`);
        }
      }),
    );
  }
}
