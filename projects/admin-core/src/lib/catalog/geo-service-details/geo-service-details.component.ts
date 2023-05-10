import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { selectGeoServiceById } from '../state/catalog.selectors';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { GeoServiceService } from '../services/geo-service.service';
import { GeoServiceUpdateModel } from '../models/geo-service-update.model';
import { LayerSettingsModel } from '@tailormap-admin/admin-api';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { MatDialog } from '@angular/material/dialog';
import { GeoServiceUsedDialogComponent } from './geo-service-used-dialog/geo-service-used-dialog.component';

@Component({
  selector: 'tm-admin-geo-service-details',
  templateUrl: './geo-service-details.component.html',
  styleUrls: ['./geo-service-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoServiceDetailsComponent implements OnInit, OnDestroy {

  public geoService$: Observable<ExtendedGeoServiceModel | null> = of(null);
  private destroyed = new Subject();
  public updatedGeoService: GeoServiceUpdateModel | null = null;
  public updatedDefaultLayerSettings: LayerSettingsModel | null = null;

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private geoServiceService: GeoServiceService,
    private confirmDelete: ConfirmDialogService,
    private dialog: MatDialog,
    private router: Router,
  ) { }

  public ngOnInit(): void {
    this.geoService$ = this.route.paramMap.pipe(
      takeUntil(this.destroyed),
      map(params => params.get('serviceId')),
      distinctUntilChanged(),
      filter((serviceId): serviceId is string => !!serviceId),
      switchMap(serviceId => this.store$.select(selectGeoServiceById(serviceId))),
      tap(geoService => { if (geoService) { this.updatedGeoService = null; }}),
    );
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateGeoService($event: GeoServiceUpdateModel) {
    this.updatedGeoService = $event;
  }

  public updateDefaultLayerSettings($event: LayerSettingsModel) {
    this.updatedDefaultLayerSettings = $event;
  }

  public save(geoServiceId: string) {
    if (!this.updatedGeoService && !this.updatedDefaultLayerSettings) {
      return;
    }
    this.savingSubject.next(true);
    this.geoServiceService.updateGeoService$(
      geoServiceId,
      () => this.updatedGeoService || {},
      serviceSetting => ({ ...this.updatedGeoService?.settings, defaultLayerSettings: { ...serviceSetting.defaultLayerSettings, ...(this.updatedDefaultLayerSettings || {}) } }),
    )
      .pipe(takeUntil(this.destroyed))
      .subscribe(success => {
        if (success) {
          this.updatedGeoService = null;
          this.updatedDefaultLayerSettings = null;
        }
        this.savingSubject.next(false);
      });
  }

  public deleteService(geoService: ExtendedGeoServiceModel) {
    this.confirmDelete.confirm$(
      `Delete service ${geoService.title}`,
      `Are you sure you want to delete service ${geoService.title}? This action cannot be undone.`,
      true,
    )
      .pipe(
        take(1),
        filter(answer => answer),
        switchMap(() => this.geoServiceService.deleteGeoService$(geoService.id, geoService.catalogNodeId)),
      )
      .subscribe(response => {
        if (!response.success && response.applicationsUsingService) {
          this.dialog.open(GeoServiceUsedDialogComponent, {
            data: { applications: response.applicationsUsingService, service: geoService },
          });
          return;
        }
        this.router.navigateByUrl('/catalog');
      });
  }

}
