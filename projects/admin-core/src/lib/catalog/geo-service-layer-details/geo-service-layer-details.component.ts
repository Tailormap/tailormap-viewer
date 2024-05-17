import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { selectGeoServiceAndLayerByLayerId, selectGeoServiceLayerSettingsByLayerId } from '../state/catalog.selectors';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { GeoServiceService } from '../services/geo-service.service';
import { LayerSettingsModel } from '@tailormap-admin/admin-api';
import { GeoServiceLayerSettingsModel } from '../models/geo-service-layer-settings.model';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';

@Component({
  selector: 'tm-admin-geo-service-layer-details',
  templateUrl: './geo-service-layer-details.component.html',
  styleUrls: ['./geo-service-layer-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoServiceLayerDetailsComponent implements OnInit, OnDestroy {

  public geoServiceLayerSettings$: Observable<GeoServiceLayerSettingsModel | null> = of(null);
  private destroyed = new Subject();
  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  public updatedLayerSettings: LayerSettingsModel | null = null;

  public isLeaf$: Observable<boolean | null> = of(true);

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private geoServiceService: GeoServiceService,
    private adminSnackbarService: AdminSnackbarService,
  ) { }

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
        if (layerSettings) { this.updatedLayerSettings = null; }
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
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateSettings($event: LayerSettingsModel | null) {
    this.updatedLayerSettings = $event;
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
      serviceSetting => ({ layerSettings: { ...(serviceSetting.layerSettings || {}), [layerName]: updatedLayerSettings } }),
    )
      .subscribe(() => {
        this.adminSnackbarService.showMessage($localize `:@@admin-core.catalog.layer-settings-updated:Layer settings updated`);
        this.savingSubject.next(false);
      });
  }

}
