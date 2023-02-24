import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { selectGeoServiceAndLayerById } from '../state/catalog.selectors';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { GeoServiceService } from '../services/geo-service.service';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';
import { GeoServiceSettingsModel, LayerSettingsModel } from '@tailormap-admin/admin-api';

@Component({
  selector: 'tm-admin-geo-service-layer-details',
  templateUrl: './geo-service-layer-details.component.html',
  styleUrls: ['./geo-service-layer-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoServiceLayerDetailsComponent implements OnInit, OnDestroy {

  public geoServiceAndLayer$: Observable<{ service: ExtendedGeoServiceModel; layer: ExtendedGeoServiceLayerModel } | null> = of(null);
  private destroyed = new Subject();
  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  public updatedLayerSettings: LayerSettingsModel = {};

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private geoServiceService: GeoServiceService,
  ) { }

  public ngOnInit(): void {
    this.geoServiceAndLayer$ = this.route.paramMap.pipe(
      distinctUntilChanged((prev: ParamMap, curr: ParamMap) => {
        return prev.get('serviceId') === curr.get('serviceId') && prev.get('layerId') === curr.get('layerId');
      }),
      map(params => ({ serviceId: params.get('serviceId'), layerId: params.get('layerId') })),
      switchMap(({ serviceId, layerId }) => {
        if (typeof serviceId !== 'string' || typeof layerId !== 'string') {
          return of(null);
        }
        return this.store$.select(selectGeoServiceAndLayerById(serviceId, layerId));
      }),
    );
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public getSettings(service: ExtendedGeoServiceModel, layer: ExtendedGeoServiceLayerModel) {
    const layerSettings = service.settings?.layerSettings || {};
    return layerSettings[layer.name] || {};
  }

  public updateSettings($event: LayerSettingsModel) {
    this.updatedLayerSettings = $event;
  }

  public save(service: ExtendedGeoServiceModel, layer: ExtendedGeoServiceLayerModel) {
    if (!this.updatedLayerSettings) {
      return;
    }
    this.savingSubject.next(true);
    const updatedSettings: GeoServiceSettingsModel = {
      ...service.settings,
      layerSettings: {
        ...(service.settings?.layerSettings || {}),
        [layer.name]: this.updatedLayerSettings,
      },
    };
    this.geoServiceService.updateGeoService$({ settings: updatedSettings, id: service.id }, service.catalogNodeId)
      .pipe(takeUntil(this.destroyed))
      .subscribe(() => this.savingSubject.next(false));
  }

}
