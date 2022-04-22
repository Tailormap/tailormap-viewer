import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { MapService, MousePositionToolConfigModel, MousePositionToolModel, ToolTypeEnum } from '@tailormap-viewer/map';
import { concatMap, filter, map, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'tm-mouse-coordinates',
  templateUrl: './mouse-coordinates.component.html',
  styleUrls: ['./mouse-coordinates.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MouseCoordinatesComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public coordinates$: Observable<string> = of('');

  constructor(
    private mapService: MapService,
  ) { }

  public ngOnInit(): void {
    this.coordinates$ = this.mapService.createTool$<MousePositionToolModel, MousePositionToolConfigModel>({
      type: ToolTypeEnum.MousePosition,
      alwaysEnabled: true,
    })
      .pipe(
        takeUntil(this.destroyed),
        filter(Boolean),
        concatMap(tool => tool.mouseMove$),
        switchMap(mouseMove => {
          if (mouseMove.type === 'out') {
            return of('');
          }
          return this.mapService.getRoundedCoordinates$(mouseMove.mapCoordinates)
            .pipe(map(coordinates => coordinates.join(' | ')));
        }),
      );
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
