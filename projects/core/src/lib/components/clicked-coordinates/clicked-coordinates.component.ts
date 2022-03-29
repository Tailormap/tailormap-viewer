import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { concatMap, of, Subject, takeUntil, tap } from 'rxjs';
import { MapClickToolConfigModel, MapClickToolModel, MapService, ToolManagerModel, ToolTypeEnum } from '@tailormap-viewer/map';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { $localize } from '@angular/localize/init';

@Component({
  selector: 'tm-clicked-coordinates',
  templateUrl: './clicked-coordinates.component.html',
  styleUrls: ['./clicked-coordinates.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClickedCoordinatesComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  private toolConfig: MapClickToolConfigModel = {
    type: ToolTypeEnum.MapClick,
  };
  private toolId = '';
  private manager: ToolManagerModel | null = null;
  public toolActive: boolean;

  constructor(private mapService: MapService, private snackBar: MatSnackBar, private clipboard: Clipboard) {
    this.toolActive = false;
  }

  public ngOnInit(): void {
    this.mapService.createTool$(this.toolConfig)
      .pipe(
        takeUntil(this.destroyed),
        tap(([manager, toolId]) => {
          this.toolId = toolId;
          this.manager = manager;
        }),
        concatMap(([manager, toolId]) => {
          const clickTool = manager.getTool<MapClickToolModel>(toolId);
          return !clickTool ? of(null) : clickTool.mapClick$;
        }),
      )
      .subscribe(mapClick => {
        if ((!mapClick) || (!this.toolActive)) {
          return;
        }
        this.handleMapClick(mapClick);
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public toggle() {
    if (this.toolActive) {
      this.manager?.disableTool(this.toolId);
      this.toolActive = false;
    } else {
      this.toolActive = true;
      this.manager?.enableTool(this.toolId, true);
    }
  }

  private handleMapClick(evt: { mapCoordinates: [number, number]; mouseCoordinates: [number, number] }) {
    let decimals = 4;
    this.mapService.getUnitsOfMeasure$().subscribe(uom => {
      switch (uom) {
        case 'm':
          decimals = 2;
          break;
        case 'ft':
        case 'us-ft':
          decimals = 3;
          break;
        case 'degrees':
        default:
          decimals = 4;
      }
    });

    const coordinatesMsg = $localize`Selected coordinates: ${evt.mapCoordinates[0].toFixed(decimals)}, ${evt.mapCoordinates[1].toFixed(decimals)}`;

    this.snackBar.open(coordinatesMsg, $localize`Copy`).onAction().subscribe(() => {
      if (this.clipboard.copy(coordinatesMsg)) {
        this.snackBar.open($localize`Success`, '', {duration: 5000});
      } else {
        this.snackBar.open($localize`Failed to copy to clipboard`, '', {duration: 5000});
      }
    });
  }
}
