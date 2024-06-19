import { DestroyRef, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectAutoRefreshableLayers } from '../state/map.selectors';
import { Subscription, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LayerManagerModel, MapService } from '@tailormap-viewer/map';
import { ExtendedAppLayerModel } from '../models';

interface RefreshableLayer extends ExtendedAppLayerModel {
  id: string;
  autoRefreshInSeconds: number;
}

@Injectable({
  providedIn: 'root',
})
export class ApplicationLayerRefreshService {

  private refreshingLayers = new Map<string, Subscription>();
  private layerManager: LayerManagerModel | undefined;

  constructor(
    private store$: Store,
    private destroyRef: DestroyRef,
    private mapService: MapService,
  ) {
    this.mapService.getLayerManager$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(layerManager => this.layerManager = layerManager);
    this.store$.select(selectAutoRefreshableLayers)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(layers => {
        const refreshableLayers: RefreshableLayer[] = layers
          .filter((l): l is RefreshableLayer => typeof l.autoRefreshInSeconds === 'number');
        this.setRefreshLayers(refreshableLayers);
      });
  }

  public setRefreshLayers(refreshableLayer: RefreshableLayer[]) {
    const ids = new Set(refreshableLayer.map(r => r.id));
    const currentIds = Array.from(this.refreshingLayers.keys());
    currentIds.forEach((key) => {
      if (!ids.has(key)) {
        this.refreshingLayers.get(key)?.unsubscribe();
        this.refreshingLayers.delete(key);
      }
    });
    refreshableLayer.forEach(layer => {
      if (!this.refreshingLayers.has(layer.id)) {
        const interval = layer.autoRefreshInSeconds * 1000;
        const refreshSubscription = timer(interval, interval)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.layerManager?.refreshLayer(layer.id);
          });
        this.refreshingLayers.set(layer.id, refreshSubscription);
      }
    });
  }

}
