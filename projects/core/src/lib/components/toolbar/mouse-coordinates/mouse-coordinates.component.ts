import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { MapService, MousePositionToolConfigModel, MousePositionToolModel, ToolTypeEnum } from '@tailormap-viewer/map';
import { concatMap, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectIn3DView } from '../../../map/state/map.selectors';

@Component({
  selector: 'tm-mouse-coordinates',
  templateUrl: './mouse-coordinates.component.html',
  styleUrls: ['./mouse-coordinates.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MouseCoordinatesComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public coordinates$: Observable<string[]> = of([]);
  private overCoordinatesElement = false;
  public in3DView$: Observable<boolean>;

  constructor(
    private mapService: MapService,
    private store$: Store,
  ) {
    this.in3DView$ = this.store$.select(selectIn3DView);
  }

  public ngOnInit(): void {
    this.coordinates$ = this.mapService.createTool$<MousePositionToolModel, MousePositionToolConfigModel>({
      type: ToolTypeEnum.MousePosition,
      alwaysEnabled: true,
    })
      .pipe(
        takeUntil(this.destroyed),
        concatMap(({ tool }) => tool.mouseMove$),
        switchMap(mouseMove => {
          if (mouseMove.type === 'out' && !this.overCoordinatesElement) {
            return of([]);
          }
          return this.mapService.getRoundedCoordinates$(mouseMove.mapCoordinates);
        }),
      );
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public isOverCoordinates(isOverCoordinates: boolean) {
    this.overCoordinatesElement = isOverCoordinates;
  }

}
