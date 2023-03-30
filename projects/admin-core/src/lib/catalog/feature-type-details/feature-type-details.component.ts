import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { selectGeoServiceLayerSettingsById } from '../state/catalog.selectors';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { GeoServiceService } from '../services/geo-service.service';
import { LayerSettingsModel } from '@tailormap-admin/admin-api';
import { GeoServiceLayerSettingsModel } from '../models/geo-service-layer-settings.model';

@Component({
  selector: 'tm-admin-feature-type-details',
  templateUrl: './feature-type-details.component.html',
  styleUrls: ['./feature-type-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureTypeDetailsComponent implements OnInit, OnDestroy {

  public geoServiceLayerSettings$: Observable<GeoServiceLayerSettingsModel | null> = of(null);
  private destroyed = new Subject();
  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  public updatedLayerSettings: LayerSettingsModel | null = null;

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
      tap(layerSettings => { if (layerSettings) { this.updatedLayerSettings = null; }}),
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
    const updatedLayerSettings = { ...this.updatedLayerSettings };
    this.savingSubject.next(true);
    this.geoServiceService.updateGeoService$(
      serviceId,
      () => ({}),
      serviceSetting => ({ layerSettings: { ...(serviceSetting.layerSettings || {}), [layerName]: updatedLayerSettings } }),
    )
      .subscribe(() => {
        this.savingSubject.next(false);
      });
  }

}
