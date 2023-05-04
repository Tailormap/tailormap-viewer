import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { selectGeoServiceById } from '../state/catalog.selectors';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { GeoServiceService } from '../services/geo-service.service';
import { GeoServiceUpdateModel } from '../models/geo-service-update.model';
import { LayerSettingsModel } from '@tailormap-admin/admin-api';

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

}
