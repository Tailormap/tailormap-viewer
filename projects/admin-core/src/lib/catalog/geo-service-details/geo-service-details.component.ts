import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject, concatMap, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, take, takeUntil, tap,
} from 'rxjs';
import { selectGeoServiceById } from '../state/catalog.selectors';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { GeoServiceService } from '../services/geo-service.service';
import { GeoServiceUpdateModel } from '../models/geo-service-update.model';
import { GeoServiceModel, GeoServiceProtocolEnum, GeoServiceWithLayersModel, LayerSettingsModel } from '@tailormap-admin/admin-api';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { MatDialog } from '@angular/material/dialog';
import { GeoServiceUsedDialogComponent } from './geo-service-used-dialog/geo-service-used-dialog.component';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { FormHelper } from '../../helpers/form.helper';

@Component({
  selector: 'tm-admin-geo-service-details',
  templateUrl: './geo-service-details.component.html',
  styleUrls: ['./geo-service-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoServiceDetailsComponent implements OnInit, OnDestroy {

  public geoService$: Observable<GeoServiceModel | null> = of(null);
  private destroyed = new Subject();
  public updatedGeoService: GeoServiceUpdateModel | null = null;
  public updatedDefaultLayerSettings: LayerSettingsModel | null = null;

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  private refreshingSubject = new BehaviorSubject(false);
  public refreshing$ = this.refreshingSubject.asObservable();

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private geoServiceService: GeoServiceService,
    private confirmDialog: ConfirmDialogService,
    private dialog: MatDialog,
    private router: Router,
    private adminSnackbarService: AdminSnackbarService,
  ) { }

  public ngOnInit(): void {
    this.geoService$ = this.route.paramMap.pipe(
      takeUntil(this.destroyed),
      map(params => params.get('serviceId')),
      distinctUntilChanged(),
      filter((serviceId): serviceId is string => !!serviceId),
      switchMap(serviceId => this.geoServiceService.getDraftGeoService$(serviceId)),
      tap(geoService => { if (geoService) {
        this.updatedGeoService = null;
        this.updatedDefaultLayerSettings = null;
      }}),
    );
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateGeoService($event: GeoServiceUpdateModel | null) {
    this.updatedGeoService = $event;
  }

  public updateDefaultLayerSettings($event: LayerSettingsModel | null) {
    this.updatedDefaultLayerSettings = $event;
  }

  public save(geoService: GeoServiceModel) {
    if (!this.updatedGeoService && !this.updatedDefaultLayerSettings) {
      return;
    }
    this.savingSubject.next(true);
    this.geoServiceService.updateGeoService$(
      geoService.id,
      () => this.updatedGeoService || {},
      serviceSetting => ({ ...this.updatedGeoService?.settings, defaultLayerSettings: { ...serviceSetting.defaultLayerSettings, ...(this.updatedDefaultLayerSettings || {}) } }),
    )
      .pipe(takeUntil(this.destroyed))
      .subscribe(updatedGeoService => {
        if (updatedGeoService && updatedGeoService.protocol !== GeoServiceProtocolEnum.XYZ) {
          this.checkToRefresh(geoService, updatedGeoService);
          this.adminSnackbarService.showMessage($localize `:@@admin-core.catalog.service-updated:Service updated`);
          this.updatedGeoService = null;
          this.updatedDefaultLayerSettings = null;
        }
        this.savingSubject.next(false);
      });
  }

  private checkToRefresh(service: GeoServiceModel, updatedService: GeoServiceWithLayersModel | null) {
    if (!updatedService || !FormHelper.someValuesChanged([
      [ service.url, updatedService.url ],
      [ service.authentication?.username, updatedService.authentication?.username ],
      [ service.authentication?.password, updatedService.authentication?.password ],
    ])) {
      return;
    }
    this.confirmDialog.confirm$(
      $localize `:@@admin-core.catalog.refresh-service-confirm:Refresh service?`,
      // eslint-disable-next-line max-len
      $localize `:@@admin-core.catalog.refresh-service-confirm-message:The settings for the service are updated. Do you want to refresh the service to refresh the capabilities and layers?`,
    )
      .pipe(takeUntil(this.destroyed))
      .subscribe(result => {
        if (result) {
          this.refresh(service.id);
        }
      });
  }

  public refresh(serviceId: string) {
    this.refreshingSubject.next(true);
    this.geoServiceService.refreshGeoService$(serviceId)
      .pipe(takeUntil(this.destroyed))
      .subscribe(success => {
        if (success) {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.catalog.service-refreshed:Service refreshed`);
        }
        this.refreshingSubject.next(false);
      });
  }

  public deleteService(geoService: GeoServiceModel) {
    this.store$.select(selectGeoServiceById(geoService.id))
      .pipe(
        take(1),
        map(s => s?.catalogNodeId || ''),
        concatMap(catalogNodeId => {
          return this.geoServiceService.getApplicationsUsingService$(geoService.id)
            .pipe(
              take(1),
              concatMap(applications => {
                if (applications.length > 0) {
                  return this.dialog.open(GeoServiceUsedDialogComponent, {
                    data: { applications, service: geoService },
                  }).afterClosed().pipe(map(() => false));
                }
                return this.confirmDialog.confirm$(
                  $localize `:@@admin-core.catalog.delete-service-confirm:Delete service ${geoService.title}`,
                  $localize `:@@admin-core.catalog.delete-service-confirm-message:Are you sure you want to delete service ${geoService.title}? This action cannot be undone.`,
                  true,
                );
              }),
              concatMap(confirmed => {
                if (confirmed) {
                  return this.geoServiceService.deleteGeoService$(geoService.id, catalogNodeId);
                }
                return of({ success: false });
              }),
            );
        }),
      )
      .subscribe(response => {
        if (!response.success) {
          return;
        }
        this.adminSnackbarService.showMessage($localize `:@@admin-core.catalog.service-removed:Service ${geoService.title} removed`);
        this.router.navigateByUrl('/admin/catalog');
      });
  }

}
