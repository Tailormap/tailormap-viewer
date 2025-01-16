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
  standalone: false,
})
export class LayerTransparencyComponent {

  private store$ = inject(Store);

  public opacity$ = of(100);

  private layerId: string | undefined;

  @Input()
  public set layer(layer: string | null) {
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

  public updateOpacity($event: number | null) {
    this.dispatchChange($event === null ? 100 : $event);
  }

  public resetOpacity() {
    if (this.layerId === undefined) {
      return;
    }

    this.store$.select(selectLayer(this.layerId))
      .pipe(take(1))
      .subscribe(layer => {
        this.dispatchChange(layer?.initialValues?.opacity ?? 100);
      });
  }

  private dispatchChange(opacity: number) {
    if (!this.layerId) {
      return;
    }
    this.store$.dispatch(setLayerOpacity({ opacity: [{ id: this.layerId, opacity }] }));
  }
}
