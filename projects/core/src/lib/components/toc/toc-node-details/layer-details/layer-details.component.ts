import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { LegendInfoModel } from '../../../legend/models/legend-info.model';
import { LegendService } from '../../../legend/services/legend.service';
import { MapService } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { selectLayerWithService } from '../../../../map/state/map.selectors';

@Component({
  selector: 'tm-layer-details',
  templateUrl: './layer-details.component.html',
  styleUrls: ['./layer-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LayerDetailsComponent {

  private legendService = inject(LegendService);
  private mapService = inject(MapService);
  private store$ = inject(Store);

  private _layerId: string | null = null;

  @Input()
  public set layerId(layerId: string | null) {
    this._layerId = layerId;
    this.updateLegend();
  }
  public get layerId(): string | null {
    return this._layerId;
  }

  public legendInfo$: Observable<LegendInfoModel | null> = of(null);

  private updateLegend() {
    if (!this.layerId) {
      return;
    }
    this.legendInfo$ = this.legendService.getLegendInfo$(
      this.store$.select(selectLayerWithService(this.layerId)),
      this.mapService.getMapViewDetails$(),
    )
      .pipe(map(legendInfo => legendInfo.length !== 0 ? legendInfo[0] : null));
  }

}
