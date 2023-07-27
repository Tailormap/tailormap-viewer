import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFullLayerDetails } from '../state/map.selectors';
import { filter, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { AppLayerModel, LayerDetailsModel, TAILORMAP_API_V1_SERVICE, TailormapApiV1ServiceModel } from '@tailormap-viewer/api';
import { selectViewerId } from '../../state/core.selectors';
import { addLayerDetails } from '../state/map.actions';

@Injectable({
  providedIn: 'root',
})
export class ApplicationLayerService {

  constructor(
    private store$: Store,
    @Inject(TAILORMAP_API_V1_SERVICE) private api: TailormapApiV1ServiceModel,
  ) {}

  public getLayerDetails$(layerId: string): Observable<{ layer: AppLayerModel; details: LayerDetailsModel }> {
    return this.store$.select(selectFullLayerDetails(layerId))
      .pipe(
        switchMap(details => {
          if (!details) {
            return of(null);
          }
          if (!details.details) {
            return this.fetchLayerDetails(layerId)
              .pipe(
                map(layerDetails => {
                  return {
                    layer: details.layer,
                    details: layerDetails,
                  };
                }),
              );
          }
          return of(details);
        }),
        filter((details): details is { layer: AppLayerModel; details: LayerDetailsModel } => {
          return details !== null && !!details.details && !!details.layer;
        }),
      );
  }

  private fetchLayerDetails(layerId: string) {
    return this.store$.select(selectViewerId)
      .pipe(
        take(1),
        filter((applicationId: string | null): applicationId is string => applicationId !== null),
        switchMap((applicationId: string) => this.api.getDescribeLayer$({ layerId, applicationId })),
        tap((layerDetails: LayerDetailsModel) => {
          if (layerDetails) {
            this.store$.dispatch(addLayerDetails({ layerDetails }));
          }
        }),
      );
  }

}
