import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { concatMap, map, Observable, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { MapClickToolConfigModel, MapClickToolModel, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { Store } from '@ngrx/store';
import { isActiveToolbarTool } from '../state/toolbar.selectors';
import { deregisterTool, registerTool, toggleTool } from '../state/toolbar.actions';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';
import { selectEnable3D } from '../../../state/core.selectors';


@Component({
  selector: 'tm-switch3D',
  templateUrl: './switch3-d.component.html',
  styleUrls: ['./switch3-d.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Switch3DComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public enable$: Observable<boolean>;

  constructor(
    private store$: Store,
    private mapService: MapService,
  ) {
    this.enable$ = this.store$.select(selectEnable3D);
  }

  public ngOnInit(): void {

  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public toggle() {
    this.mapService.switch3D$()

  }
}
