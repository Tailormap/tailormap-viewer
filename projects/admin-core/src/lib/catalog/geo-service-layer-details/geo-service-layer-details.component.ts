import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, Observable, of, Subject, switchMap, take, tap } from 'rxjs';
import {
  selectGeoServiceAndLayerByLayerId, selectGeoServiceLayersByGeoServiceId, selectGeoServiceLayerSettingsByLayerId,
} from '../state/catalog.selectors';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { GeoServiceService } from '../services/geo-service.service';
import { LayerSettingsModel } from '@tailormap-admin/admin-api';
import { GeoServiceLayerSettingsModel } from '../models/geo-service-layer-settings.model';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { UploadCategoryEnum } from '@tailormap-admin/admin-api';
import { UPLOAD_REMOVE_SERVICE } from '../../shared/components/select-upload/models/upload-remove-service.injection-token';
import { LegendImageRemoveService } from '../services/legend-image-remove.service';
import { AdminProjectionsHelper, ProjectionAvailability } from '../../application/helpers/admin-projections-helper';

@Component({
  selector: 'tm-admin-geo-service-layer-details',
  templateUrl: './geo-service-layer-details.component.html',
  styleUrls: ['./geo-service-layer-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UPLOAD_REMOVE_SERVICE, useClass: LegendImageRemoveService },
  ],
  standalone: false,
})
export class GeoServiceLayerDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private store$ = inject(Store);
  private geoServiceService = inject(GeoServiceService);
  private adminSnackbarService = inject(AdminSnackbarService);


  public geoServiceLayerSettings$: Observable<GeoServiceLayerSettingsModel | null> = of(null);
  private destroyed = new Subject();
  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  public legendCategory = UploadCategoryEnum.LEGEND;

  public updatedLayerSettings: Partial<LayerSettingsModel> | null = null;
  public legendImageId: string | null | undefined = null;

  public isLeaf$: Observable<boolean | null> = of(true);

  public projectionAvailability$: Observable<ProjectionAvailability[] | null> = of(null);

  public ngOnInit(): void {
    const layerId$ = this.route.paramMap.pipe(
      map(params => params.get('layerId')),
      distinctUntilChanged(),
    );

    this.geoServiceLayerSettings$ = layerId$.pipe(
      switchMap(layerId => {
        if (typeof layerId !== 'string') {
          return of(null);
        }
        return this.store$.select(selectGeoServiceLayerSettingsByLayerId(layerId));
      }),
      tap(layerSettings => {
        if (layerSettings) {
          this.updatedLayerSettings = null;
          this.legendImageId = layerSettings.settings.legendImageId;
        }
      }),
    );

    this.isLeaf$ = layerId$.pipe(
      switchMap(layerId => {
        if (typeof layerId !== 'string') {
          return of(null);
        }
        return this.store$.select(selectGeoServiceAndLayerByLayerId(layerId));
      }),
      map(info => info ? info.layer.children?.length === 0 : true),
    );

    this.projectionAvailability$ = layerId$.pipe(
      switchMap(layerId => {
        if (typeof layerId !== 'string') {
          return of(null);
        }
        return this.store$.select(selectGeoServiceAndLayerByLayerId(layerId));
      }),
      switchMap(serviceAndLayer => {
        if (!serviceAndLayer) {
          return of(null);
        }
        return this.store$.select(selectGeoServiceLayersByGeoServiceId(serviceAndLayer.service.id))
          .pipe(
            take(1),
            map(layersInService => {
              return AdminProjectionsHelper.getProjectionAvailabilityForServiceLayer(serviceAndLayer.layer, layersInService);
            }),
          );
      }),
    );
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateSettings($event: LayerSettingsModel | null) {
    this.updatedLayerSettings = $event;
  }

  public onLegendImageChanged(uploadId: string | null) {
    if (this.updatedLayerSettings) {
      this.updatedLayerSettings.legendImageId = uploadId;
    } else {
      this.updatedLayerSettings = { legendImageId: uploadId };
    }
    this.legendImageId = uploadId;
  }

  public save(serviceId: string, layerName: string) {
    if (!this.updatedLayerSettings) {
      return;
    }
    const updatedLayerSettings = { ...this.updatedLayerSettings };
    this.savingSubject.next(true);
    this.geoServiceService.updateGeoService$(
      serviceId,
      () => ({}),
      serviceSetting => {
        const layerSettings = serviceSetting.layerSettings || {};
        return {
          layerSettings: {
            ...layerSettings,
            [layerName]: { ...layerSettings[layerName], ...updatedLayerSettings },
          },
        };
      },
    )
      .subscribe(result => {
        if (result) {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.catalog.layer-settings-updated:Layer settings updated`);
        }
        this.savingSubject.next(false);
      });
  }

}
