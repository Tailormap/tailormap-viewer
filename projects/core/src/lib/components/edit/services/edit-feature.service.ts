import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorResponseModel, FeatureModel, TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { HttpStatusCode } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EditFeatureService {
  private snackBar = inject(MatSnackBar);
  private api = inject<TailormapApiV1ServiceModel>(TAILORMAP_API_V1_SERVICE);


  private showSnackbarMessage(msg: string, e?: ErrorResponseModel | any) {
    if (e && e.error && e.error.message) {
      msg = `${msg}: ${e.error.message}`;
    }
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
        this.showSnackbarMessage($localize `:@@core.edit.delete-feature-failed:Delete feature failed`, _e);
        return of(false);
      }),
      map((succes) => succes === HttpStatusCode.Ok || succes === HttpStatusCode.NoContent),
      tap((succes) => {
        if (succes) {
          this.showSnackbarMessage($localize `:@@core.edit.feature-deleted:Feature deleted`);
        }
        return of(true);
      }),
    );
  }

  public updateFeature$(applicationId: string, layerId: string, feature: FeatureModel): Observable<FeatureModel | null> {
    return this.api.updateFeature$({ applicationId, layerId, feature }).pipe(
      catchError((_e) => {
        this.showSnackbarMessage($localize `:@@core.edit.update-feature-failed:Update feature failed`, _e);
        return of(null);
      }),
      tap(result => {
        if (result) {
          this.showSnackbarMessage($localize `:@@core.edit.feature-updated:Feature updated`);
        }
      }),
    );
  }

  public createFeature$(applicationId: string, layerId: string, feature: FeatureModel): Observable<{ success: boolean; feature: FeatureModel | null }> {
    return this.api.createFeature$({ applicationId, layerId, feature }).pipe(
      map(result => {
        return { success: true, feature: result };
      }),
      catchError((_e) => {
        this.showSnackbarMessage($localize `:@@core.edit.create-feature-failed:Create feature failed`, _e);
        return of({ success: false, feature: null });
      }),
      tap(result => {
        if (result.success) {
          this.showSnackbarMessage($localize `:@@core.edit.feature-created:Feature created`);
        }
      }),
    );
  }
}
