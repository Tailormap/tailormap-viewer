import { Component, ChangeDetectionStrategy, Input, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { Store } from '@ngrx/store';
import { selectFeatureTypeById, selectGeoServiceAndLayerByLayerId, selectGeoServiceById } from '../state/catalog.selectors';
import { BehaviorSubject, combineLatest, concatMap, map, Observable, of, switchMap, take } from 'rxjs';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { GeoServiceFormDialogComponent } from '../geo-service-form-dialog/geo-service-form-dialog.component';
import { GeoServiceService } from '../services/geo-service.service';
import { MatDialog } from '@angular/material/dialog';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { GeoServiceLayerFormDialogComponent } from '../geo-service-layer-form-dialog/geo-service-layer-form-dialog.component';
import { FeatureTypeFormDialogComponent } from '../feature-type-form-dialog/feature-type-form-dialog.component';
import { FeatureSourceService } from '../services/feature-source.service';

type ServiceAndLayer = { service: ExtendedGeoServiceModel; layer: ExtendedGeoServiceLayerModel };
type ServiceAndLayerFullName = ServiceAndLayer & { fullLayerName: string };

@Component({
  selector: 'tm-admin-catalog-shortcut-buttons',
  templateUrl: './catalog-shortcut-buttons.component.html',
  styleUrls: ['./catalog-shortcut-buttons.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CatalogShortcutButtonsComponent {

  @Input()
  public set geoServiceId(geoServiceId: string | null) {
    this.geoServiceIdSubject.next(geoServiceId);
  }

  @Input()
  public set geoServiceLayerId(geoServiceLayerId: string | null) {
    this.geoServiceLayerIdSubject.next(geoServiceLayerId);
  }

  @Input()
  public set featureTypeId(featureTypeId: string | null) {
    this.featureTypeIdSubject.next(featureTypeId);
  }

  private featureTypeIdSubject = new BehaviorSubject<string | null>(null);
  private geoServiceIdSubject = new BehaviorSubject<string | null>(null);
  private geoServiceLayerIdSubject = new BehaviorSubject<string | null>(null);

  public featureType$: Observable<ExtendedFeatureTypeModel | null>;
  public geoService$: Observable<ExtendedGeoServiceModel | null>;
  public geoServiceLayer$: Observable<ServiceAndLayerFullName | null>;
  public hasShortcuts$: Observable<boolean>;

  constructor(
    private store$: Store,
    private geoServiceService: GeoServiceService,
    private featureSourceService: FeatureSourceService,
    private dialog: MatDialog,
    private adminSnackbarService: AdminSnackbarService,
    private destroyRef: DestroyRef,
  ) {
    this.featureType$ = this.featureTypeIdSubject.asObservable()
      .pipe(switchMap(featureTypeId => featureTypeId
        ? this.store$.select(selectFeatureTypeById(featureTypeId))
        : of(null)));
    this.geoService$ = this.geoServiceIdSubject.asObservable()
      .pipe(switchMap(geoServiceLayerId => geoServiceLayerId
        ? this.store$.select(selectGeoServiceById(geoServiceLayerId))
        : of(null)));
    this.geoServiceLayer$ = this.geoServiceLayerIdSubject.asObservable()
      .pipe(switchMap(geoServiceId => geoServiceId
        ? this.store$.select(selectGeoServiceAndLayerByLayerId(geoServiceId)).pipe(map(CatalogShortcutButtonsComponent.addFullName))
        : of(null)));
    this.hasShortcuts$ = combineLatest([
      this.featureType$,
      this.geoService$,
      this.geoServiceLayer$,
    ]).pipe(map(([ featureType, geoService, geoServiceLayer ]) => {
      return featureType !== null || geoService !== null || geoServiceLayer !== null;
    }));
  }

  public updateFeatureTypeSetting($event: MouseEvent, featureType: ExtendedFeatureTypeModel) {
    $event.preventDefault();
    if (!featureType) {
      return;
    }
    return this.featureSourceService.getDraftFeatureType$(featureType.originalId, `${featureType.featureSourceId}`)
      .pipe(
        take(1),
        concatMap(draftFeatureType => {
          if (!draftFeatureType) {
            return of(null);
          }
          return FeatureTypeFormDialogComponent.open(this.dialog, { featureType: draftFeatureType }).afterClosed();
        }),
      ).subscribe(updatedFeatureType => {
        if (updatedFeatureType) {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.feature-type-settings-updated:Feature type settings updated`);
        }
      });
  }

  public updateGeoServiceSetting($event: MouseEvent, geoService: ExtendedGeoServiceModel) {
    $event.preventDefault();
    this.geoServiceService.getDraftGeoService$(geoService.id)
      .pipe(
        take(1),
        concatMap(service => {
          if (!service) {
            return of(null);
          }
          return GeoServiceFormDialogComponent.open(this.dialog, {
            geoService: service,
            parentNode: geoService.catalogNodeId,
          }).afterClosed();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(updatedService => {
        if (updatedService) {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.application.service-updated:Service ${updatedService.title} updated`);
        }
      });
  }

  public updateGeoServiceLayerSetting($event: MouseEvent, geoService: ExtendedGeoServiceModel, geoServiceLayer: ExtendedGeoServiceLayerModel) {
    $event.preventDefault();
    GeoServiceLayerFormDialogComponent.open(this.dialog, {
      geoService,
      geoServiceLayer,
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updatedSettings => {
        if (updatedSettings) {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.application.layer-settings-updated:Layer settings updated`);
        }
      });
  }

  private static addFullName(serviceLayer: ServiceAndLayer | null): null | ServiceAndLayerFullName {
      if (!serviceLayer) {
        return null;
      }
      const fullTitle = [serviceLayer.layer.title];
      if (serviceLayer.layer.title !== serviceLayer.layer.name) {
        fullTitle.push(`(${serviceLayer.layer.name})`);
      }
      return { ...serviceLayer, fullLayerName: fullTitle.join(' ') };
  }

}
