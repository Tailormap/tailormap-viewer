import { Inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FeatureModel, TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { Observable, tap } from 'rxjs';
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

  public deleteFeature$(applicationId: string, layerId: string, feature: FeatureModel): Observable<HttpStatusCode> {
    return this.api.deleteFeature$({ applicationId, layerId, feature }).pipe(
      tap(() => this.showSnackbarMessage('Feature deleted')),
    );
  }

  public updateFeature$(applicationId: string, layerId: string, feature: FeatureModel): Observable<FeatureModel> {
    return this.api.updateFeature$({ applicationId, layerId, feature }).pipe(
      tap(() => this.showSnackbarMessage('Feature updated')),
    );
  }

  public createFeature$(applicationId: string, layerId: string, feature: FeatureModel): Observable<FeatureModel> {
    return this.api.createFeature$({ applicationId, layerId, feature }).pipe(
      tap(() => this.showSnackbarMessage('Feature created')),
    );
  }
}
