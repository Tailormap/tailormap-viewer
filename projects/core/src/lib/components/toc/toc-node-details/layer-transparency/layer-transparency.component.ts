import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { selectLayerOpacity } from '../../../../map/state/map.selectors';
import { MatSliderChange } from '@angular/material/slider';
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

  private layerId: number | undefined;

  @Input()
  public set layer(layer: number | null) {
    if (layer === null) {
      this.layerId = undefined;
      this.opacity$ = of(100);
      return;
    }
    this.layerId = layer;
    this.opacity$ = this.store$.select(selectLayerOpacity(layer));
  }

  public formatThumb(value: number) {
    return `${Math.round(value)}%`;
  }

  public updateOpacity($event: MatSliderChange) {
    if (!this.layerId) {
      return;
    }
    const opacity = $event.value === null ? 100 : $event.value;
    this.store$.dispatch(setLayerOpacity({ layerId: this.layerId, opacity }));
  }

  public resetOpacity() {
    if (!this.layerId) {
      return;
    }
    this.store$.dispatch(setLayerOpacity({ layerId: this.layerId, opacity: 100 }));
  }

}
