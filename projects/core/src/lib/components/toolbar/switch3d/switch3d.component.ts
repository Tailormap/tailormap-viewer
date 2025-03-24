import { ChangeDetectionStrategy, Component, computed, DestroyRef, Signal } from '@angular/core';
import { map, Observable, combineLatest, take } from 'rxjs';
import { MapService } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { selectEnable3d } from '../../../state/core.selectors';
import { toggleIn3dView } from '../../../map/state/map.actions';
import { MenubarService } from '../../menubar';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectActiveTool } from '../state/toolbar.selectors';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import {
  selectIn3dView, selectLayersWithoutWebMercatorTitles,
} from '../../../map/state/map.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';


@Component({
  selector: 'tm-switch3-d',
  templateUrl: './switch3d.component.html',
  styleUrls: ['./switch3d.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class Switch3dComponent {

  private componentsPreventingSwitching = [
    BaseComponentTypeEnum.PRINT,
    BaseComponentTypeEnum.DRAWING,
  ];
  private toolsPreventingSwitching = [
    ToolbarComponentEnum.MEASURE,
  ];

  public enable: Signal<boolean> = this.store$.selectSignal(selectEnable3d);
  public allowSwitch$: Observable<boolean>;

  public in3dView: Signal<boolean> = this.store$.selectSignal(selectIn3dView);
  public tooltip: Signal<string> = computed(() => {
    const in3dView= this.in3dView();
    if (in3dView) {
      return $localize `:@@core.toolbar.switch-3d.tooltip2D:Switch to 2D`;
    } else {
      return $localize `:@@core.toolbar.switch-3d.tooltip3D:Switch to 3D`;
    }
  });

  constructor(
    private store$: Store,
    private mapService: MapService,
    private menubarService: MenubarService,
    private snackBar: MatSnackBar,
    private destroyRef: DestroyRef,
  ) {
    this.allowSwitch$ = combineLatest([
      this.menubarService.getActiveComponent$().pipe(
        map(
          component => !this.componentsPreventingSwitching.some(disallowingComponent => disallowingComponent === component?.componentId),
        ),
      ),
      this.store$.select(selectActiveTool).pipe(
        map(
          tool => !this.toolsPreventingSwitching.some(disallowingTool => disallowingTool === tool),
        ),
      ),
    ]).pipe(
      takeUntilDestroyed(destroyRef),
      map(([ componentBoolean, toolBoolean ]) => componentBoolean && toolBoolean),
    );
  }

  public toggle() {
    this.mapService.switch3D();
    this.store$.dispatch(toggleIn3dView());
    if (this.in3dView()) {
      this.store$.select(selectLayersWithoutWebMercatorTitles)
        .pipe(take(1))
        .subscribe(layersTitles => {
          if (layersTitles && layersTitles.length > 0) {
            this.showSnackbarMessage($localize `:@@core.toolbar.switch-3d.layers-without-wm:The following layers are not visible in 3D: ${layersTitles.join(', ')}`);
          }
        });
    }
  }

  private showSnackbarMessage(msg: string) {
    const config: SnackBarMessageOptionsModel = {
      message: msg,
      duration: 10000,
      showDuration: true,
      showCloseButton: true,
    };
    SnackBarMessageComponent.open$(this.snackBar, config).subscribe();
  }

}
