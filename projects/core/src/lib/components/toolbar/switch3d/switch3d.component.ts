import { ChangeDetectionStrategy, Component, computed, DestroyRef, Signal, inject, signal } from '@angular/core';
import { map, combineLatest, take, Observable } from 'rxjs';
import { MapService } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { selectEnable3d } from '../../../state/core.selectors';
import { toggleIn3dView } from '../../../map/state/map.actions';
import { MenubarService } from '../../menubar';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import {
  selectIn3dView, selectLayersWithoutWebMercatorTitles,
} from '../../../map/state/map.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { MobileLayoutService } from '../../../services/viewer-layout/mobile-layout.service';


@Component({
  selector: 'tm-switch3-d',
  templateUrl: './switch3d.component.html',
  styleUrls: ['./switch3d.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class Switch3dComponent {
  private store$ = inject(Store);
  private mapService = inject(MapService);
  private menubarService = inject(MenubarService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private mobileLayoutService = inject(MobileLayoutService);


  public isMobileLayoutEnabled$: Observable<boolean> = this.mobileLayoutService.isMobileLayoutEnabled$;
  private componentsPreventingSwitching = [
    BaseComponentTypeEnum.PRINT,
    BaseComponentTypeEnum.DRAWING,
  ];
  private toolsPreventingSwitching = [
    BaseComponentTypeEnum.MEASURE,
    BaseComponentTypeEnum.EDIT,
  ];

  public enable: Signal<boolean> = this.store$.selectSignal(selectEnable3d);
  public allowSwitch = signal(true);

  public in3dView: Signal<boolean> = this.store$.selectSignal(selectIn3dView);
  public tooltip: Signal<string> = computed(() => {
    const in3dView= this.in3dView();
    if (in3dView) {
      return $localize `:@@core.toolbar.switch-3d.tooltip2D:Switch to 2D`;
    } else {
      return $localize `:@@core.toolbar.switch-3d.tooltip3D:Switch to 3D`;
    }
  });

  constructor() {
    combineLatest([
      this.menubarService.getActiveComponent$().pipe(
        map(
          component => !this.componentsPreventingSwitching.some(disallowingComponent => disallowingComponent === component?.componentId),
        ),
      ),
      this.mapService.someToolsEnabled$(this.toolsPreventingSwitching),
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(([ componentBoolean, toolBoolean ]) => componentBoolean && !toolBoolean),
    ).subscribe(allowSwitch => this.allowSwitch.set(allowSwitch));
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
