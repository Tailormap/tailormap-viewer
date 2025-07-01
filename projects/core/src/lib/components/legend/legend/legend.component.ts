import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { LegendService } from '../services/legend.service';
import { Observable, of, switchMap } from 'rxjs';
import { MenubarService } from '../../menubar';
import { LegendMenuButtonComponent } from '../legend-menu-button/legend-menu-button.component';
import { Store } from '@ngrx/store';
import { selectOrderedVisibleLayersWithLegend } from '../../../map/state/map.selectors';
import { MapService } from '@tailormap-viewer/map';
import { LegendInfoModel } from '../models/legend-info.model';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LegendComponent implements OnInit, OnDestroy {
  private store$ = inject(Store);
  private legendService = inject(LegendService);
  private menubarService = inject(MenubarService);
  private mapService = inject(MapService);


  public visible$: Observable<boolean>;
  public layers$: Observable<LegendInfoModel[]>;
  public trackById = (index: number, item: LegendInfoModel) => item.layer.id;

  constructor() {
    this.visible$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.LEGEND);
    this.layers$ = this.visible$.pipe(
      switchMap(visible => {
        return !visible
          ? of([])
          : this.legendService.getLegendInfo$(this.store$.select(selectOrderedVisibleLayersWithLegend), this.mapService.getMapViewDetails$());
      }),
    );
  }

  public ngOnInit() {
    this.menubarService.registerComponent({ type: BaseComponentTypeEnum.LEGEND, component: LegendMenuButtonComponent });
  }

  public ngOnDestroy() {
    this.menubarService.deregisterComponent(BaseComponentTypeEnum.LEGEND);
  }

}
