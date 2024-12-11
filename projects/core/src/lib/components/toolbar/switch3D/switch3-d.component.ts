import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { map, Observable, Subject, combineLatest } from 'rxjs';
import { MapService } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { selectEnable3D } from '../../../state/core.selectors';
import { toggleIn3DView } from '../../../map/state/map.actions';
import { MenubarService } from '../../menubar';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { selectActiveTool } from '../state/toolbar.selectors';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';


@Component({
  selector: 'tm-switch3-d',
  templateUrl: './switch3-d.component.html',
  styleUrls: ['./switch3-d.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Switch3DComponent implements OnDestroy {

  private destroyed = new Subject();
  public enable$: Observable<boolean>;
  public allowSwitch$: Observable<boolean>;
  private disallowingComponents = [
    BaseComponentTypeEnum.PRINT,
    BaseComponentTypeEnum.DRAWING,
  ];
  private disAllowingTools = [
    ToolbarComponentEnum.SELECT_COORDINATES,
    ToolbarComponentEnum.COORDINATE_LINK_WINDOW,
    ToolbarComponentEnum.STREETVIEW,
    ToolbarComponentEnum.MEASURE,
  ];

  constructor(
    private store$: Store,
    private mapService: MapService,
    private menubarService: MenubarService,
  ) {
    this.enable$ = this.store$.select(selectEnable3D);
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
      map(([ componentBoolean, toolBoolean ]) => componentBoolean && toolBoolean),
    );
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public toggle() {
    this.mapService.switch3D$();
    this.store$.dispatch(toggleIn3DView());
  }

}
