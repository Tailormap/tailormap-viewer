import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { of, take } from 'rxjs';
import { selectLayerOpacity, selectLayer } from '../../../../map/state/map.selectors';
import { setLayerOpacity } from '../../../../map/state/map.actions';

@Component({
  selector: 'tm-layer-transparency',
  templateUrl: './layer-transparency.component.html',
  styleUrls: ['./layer-transparency.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerTransparencyComponent {

  private store$ = inject(Store);

  public opacity$ = of(100);

  private layerName: string | undefined;

  @Input()
  public set layer(layer: string | null) {
    if (layer === null) {
      this.layerName = undefined;
      this.opacity$ = of(100);
      return;
    }
    this.layerName = layer;
    this.opacity$ = this.store$.select(selectLayerOpacity(layer));
  }

  public formatThumb(value: number) {
    return `${Math.round(value)}%`;
  }

  public updateOpacity($event: number | null) {
    if (!this.layerName) {
      return;
    }
    const opacity = $event === null ? 100 : $event;
    this.store$.dispatch(setLayerOpacity({ layerName: this.layerName, opacity }));
  }

  public resetOpacity() {
    if (this.layerName === undefined) {
      return;
    }

    this.store$.select(selectLayer(this.layerName))
      .pipe(take(1))
      .subscribe(layer => {
        if (!this.layerName) {
          return;
        }

        this.store$.dispatch(setLayerOpacity({ layerName: this.layerName, opacity: layer?.initialValues?.opacity ?? 100 }));
      });
  }
}
