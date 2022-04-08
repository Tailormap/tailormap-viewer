import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LegendService } from '../services/legend.service';
import { Observable, of, switchMap } from 'rxjs';
import { MenubarService } from '../../menubar';
import { LegendMenuButtonComponent } from '../legend-menu-button/legend-menu-button.component';
import { Store } from '@ngrx/store';
import { selectOrderedVisibleLayers } from '../../../map/state/map.selectors';
import { AppLayerModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegendComponent {

  public visible$: Observable<boolean>;
  public layers$: Observable<{ appLayer: AppLayerModel; url: string }[]>;
  public trackById = (index: number, item: { appLayer: AppLayerModel; url: string }) => item.appLayer.id;

  constructor(
    private store$: Store,
    private legendService: LegendService,
    private menubarService: MenubarService,
  ) {
    this.visible$ = this.legendService.isVisible$();
    this.menubarService.registerComponent(LegendMenuButtonComponent);
    this.layers$ = this.visible$.pipe(
      switchMap(visible => {
        return !visible
          ? of([])
          : this.legendService.getAppLayerAndUrl$(this.store$.select(selectOrderedVisibleLayers));
      }),
    );
  }

  public closeLegend() {
    this.legendService.toggleVisible();
  }

}
