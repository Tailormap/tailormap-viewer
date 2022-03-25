import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import {
  DrawingEnableToolArguments, DrawingToolConfigModel, DrawingToolModel, MapService, MapTooltipModel, ToolManagerModel, ToolTypeEnum,
} from '@tailormap-viewer/map';
import { BehaviorSubject, map, Subject, switchMap, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'tm-measure',
  templateUrl: './measure.component.html',
  styleUrls: ['./measure.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeasureComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  private tooltipVisible: Subject<null> | null = null;
  private toolActive: 'length' | 'area' | null = null;
  private toolId: string | null = null;
  private manager: ToolManagerModel | null = null;

  constructor(
    private mapService: MapService,
  ) { }

  public ngOnInit(): void {
    const conf: DrawingToolConfigModel = {
      type: ToolTypeEnum.Draw,
      computeSize: true,
    };
    this.mapService.createTool$(conf)
      .pipe(takeUntil(this.destroyed))
      .subscribe(([ manager, toolId ]) => {
        this.toolId = toolId;
        this.manager = manager;
    });
  }

  public ngOnDestroy(): void {
    if (this.tooltipVisible) {
      this.tooltipVisible.next(null);
      this.tooltipVisible.complete();
    }
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public measureLength() {
    this.measure('length');
  }

  public measureArea() {
    this.measure('area');
  }

  private measure(type: 'length' | 'area') {
    if (!this.manager || !this.toolId) {
      return;
    }
    if (this.toolActive) {
      this.manager.disableTool(this.toolId);
      if (this.toolActive === type) {
        this.stopMeasure();
        return;
      }
    }
    const tool = this.manager
      .enableTool<DrawingEnableToolArguments>(this.toolId, true, {
        type: type === 'area' ? 'area' : 'line',
      })
      .getTool<DrawingToolModel>(this.toolId);
    if (!tool) {
      return;
    }

    this.toolActive = type;
    this.tooltipVisible = new Subject();

    const featureGeom = new BehaviorSubject<any>(null);
    this.mapService.createTooltip$()
      .pipe(
        takeUntil(this.tooltipVisible),
        switchMap(tooltip => {
          return tool.drawStart$
            .pipe(
              tap(() => tooltip.hide()),
              switchMap(() => tool.drawChange$),
              tap(e => this.updateTooltip(tooltip, e.lastCoordinates, e.size)),
              switchMap(() => tool.drawEnd$),
              tap(e => {
                this.updateTooltip(tooltip, e.lastCoordinates, e.size);
                tooltip.freeze();
              }),
              map(e => e.geometry),
            );
        }),
      )
      .subscribe(feature => featureGeom.next(feature));

    this.mapService.highlightFeatures$('measurement-layer', featureGeom.asObservable(), {
      styleKey: 'measurement-style',
      strokeColor: '#DD0000',
      strokeWidth: 3,
    }).pipe(takeUntil(this.tooltipVisible)).subscribe();
  }

  private stopMeasure() {
    if (this.tooltipVisible) {
      this.tooltipVisible.next(null);
      this.tooltipVisible.complete();
      this.tooltipVisible = null;
    }
    this.toolActive = null;
    return;
  }

  private updateTooltip(tooltip: MapTooltipModel, coordinates: number[], size?: number) {
    tooltip
      .setContent(this.formatSize(size))
      .move(coordinates);
  }

  private formatSize(size?: number) {
    if (!size) {
      return '';
    }
    if (this.toolActive === 'length') {
      if (size > 100) {
        return (Math.round(size / 1000 * 100) / 100) + ' ' + 'km';
      } else {
        return (Math.round(size * 100) / 100) + ' ' + 'm';
      }
    }
    if (this.toolActive === 'area') {
      const el = document.createElement('div');
      if (size > 10000) {
        el.innerHTML = (Math.round(size / 1000000 * 100) / 100) +
          ' ' + 'km<sup>2</sup>';
      } else {
        el.innerHTML = (Math.round(size * 100) / 100) +
          ' ' + 'm<sup>2</sup>';
      }
      return el;
    }
    return '';
  }

}
