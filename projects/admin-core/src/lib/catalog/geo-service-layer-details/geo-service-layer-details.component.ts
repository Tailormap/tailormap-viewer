import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, concatMap, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, take } from 'rxjs';
import { selectGeoServiceById, selectGeoServiceLayerSettingsById } from '../state/catalog.selectors';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { GeoServiceService } from '../services/geo-service.service';
import { GeoServiceSettingsModel, LayerSettingsModel } from '@tailormap-admin/admin-api';
import { GeoServiceLayerSettingsModel } from '../models/geo-service-layer-settings.model';

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

  public updatedLayerSettings: LayerSettingsModel = {};

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private geoServiceService: GeoServiceService,
  ) { }

  public ngOnInit(): void {
    this.geoServiceLayerSettings$ = this.route.paramMap.pipe(
      distinctUntilChanged((prev: ParamMap, curr: ParamMap) => {
        return prev.get('serviceId') === curr.get('serviceId') && prev.get('layerId') === curr.get('layerId');
      }),
      map(params => ({ serviceId: params.get('serviceId'), layerId: params.get('layerId') })),
      switchMap(({ serviceId, layerId }) => {
        if (typeof serviceId !== 'string' || typeof layerId !== 'string') {
          return of(null);
        }
        return this.store$.select(selectGeoServiceLayerSettingsById(serviceId, layerId));
      }),
    );
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateSettings($event: LayerSettingsModel) {
    this.updatedLayerSettings = $event;
  }

  public save(serviceId: string, layerName: string) {
    if (!this.updatedLayerSettings) {
      return;
    }
    this.savingSubject.next(true);
    this.store$.select(selectGeoServiceById(serviceId))
      .pipe(
        take(1),
        filter((service): service is ExtendedGeoServiceModel => !!service),
        concatMap(service => {
          const updatedSettings: GeoServiceSettingsModel = {
            ...service.settings,
            layerSettings: {
              ...(service.settings?.layerSettings || {}),
              [layerName]: this.updatedLayerSettings,
            },
          };
          return this.geoServiceService.updateGeoService$({ settings: updatedSettings, id: service.id }, service.catalogNodeId);
        }),
      )
      .subscribe(() => {
        this.savingSubject.next(false);
      });
  }

}
