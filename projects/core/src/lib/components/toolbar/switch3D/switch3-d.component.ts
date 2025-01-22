import { ChangeDetectionStrategy, Component, computed, DestroyRef, Signal } from '@angular/core';
import { map, Observable, combineLatest } from 'rxjs';
import { MapService } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { selectEnable3D } from '../../../state/core.selectors';
import { toggleIn3DView } from '../../../map/state/map.actions';
import { MenubarService } from '../../menubar';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectActiveTool } from '../state/toolbar.selectors';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import { selectIn3DView } from '../../../map/state/map.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'tm-switch3-d',
  templateUrl: './switch3-d.component.html',
  styleUrls: ['./switch3-d.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Switch3DComponent {

  private disallowingComponents = [
    BaseComponentTypeEnum.PRINT,
    BaseComponentTypeEnum.DRAWING,
  ];
  private disAllowingTools = [
    ToolbarComponentEnum.MEASURE,
  ];

  public enable: Signal<boolean> = this.store$.selectSignal(selectEnable3D);
  public allowSwitch$: Observable<boolean>;

  public in3DView: Signal<boolean> = this.store$.selectSignal(selectIn3DView);
  public tooltip: Signal<string> = computed(() => {
    const in3DView= this.in3DView();
    if (in3DView) {
      return $localize `:@@core.toolbar.switch-3d.tooltip2D:Switch to 2D`;
    } else {
      return $localize `:@@core.toolbar.switch-3d.tooltip3D:Switch to 3D`;
    }
  });

  constructor(
    private store$: Store,
    private mapService: MapService,
    private menubarService: MenubarService,
    private destroyRef: DestroyRef,
  ) {
    this.allowSwitch$ = combineLatest([
      this.menubarService.getActiveComponent$().pipe(
        map(
          component => !this.disallowingComponents.some(disallowingComponent => disallowingComponent === component?.componentId),
        ),
      ),
      this.store$.select(selectActiveTool).pipe(
        map(
          tool => !this.disAllowingTools.some(disallowingTool => disallowingTool === tool),
        ),
      ),
    ]).pipe(
      takeUntilDestroyed(destroyRef),
      map(([ componentBoolean, toolBoolean ]) => componentBoolean && toolBoolean),
    );
  }

  public toggle() {
    this.mapService.switch3D$();
    this.store$.dispatch(toggleIn3DView());
  }

}
