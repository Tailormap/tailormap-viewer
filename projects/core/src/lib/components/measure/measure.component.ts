import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import {
  DrawingEnableToolArguments, DrawingToolConfigModel, DrawingToolModel, MapService, MapSizeHelper, MapTooltipModel, ToolManagerModel,
  ToolTypeEnum,
} from '@tailormap-viewer/map';
import { map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { HtmlHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-measure',
  templateUrl: './measure.component.html',
  styleUrls: ['./measure.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeasureComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public toolActive: 'length' | 'area' | null = null;
  private toolId = '';
  private manager: ToolManagerModel | null = null;
  private featureGeom = new Subject<string>();
  private tooltip: MapTooltipModel | null = null;

  constructor(
    private mapService: MapService,
  ) { }

  public ngOnInit(): void {
    this.mapService.createTooltip$()
      .pipe(takeUntil(this.destroyed))
      .subscribe(tooltip => this.tooltip = tooltip);

    this.mapService.highlightFeatures$('measurement-layer', this.featureGeom.asObservable(), {
      styleKey: 'measurement-style',
      strokeColor: '#6236ff',
      strokeWidth: 3,
    }).pipe(takeUntil(this.destroyed)).subscribe();

    const conf: DrawingToolConfigModel = {
      type: ToolTypeEnum.Draw,
      computeSize: true,
      strokeColor: '#6236ff',
      pointFillColor: 'transparent',
      pointStrokeColor: '#6236ff',
      drawingType: 'circle',
    };
    this.mapService.createTool$(conf)
      .pipe(
        takeUntil(this.destroyed),
        tap(([ manager, toolId ]) => {
          this.toolId = toolId;
          this.manager = manager;
        }),
        map(([ manager, toolId ]) => manager.getTool<DrawingToolModel>(toolId)),
        switchMap(tool => tool?.drawing$ || of(null)),
      )
      .subscribe(drawEvent => {
        if (!drawEvent || drawEvent.type === 'start') {
          this.hideTooltipAndGeom();
          return;
        }
        this.updateTooltip(this.tooltip, drawEvent.lastCoordinate, drawEvent.size);
        if (drawEvent.type === 'end') {
          this.tooltip?.freeze();
          this.featureGeom.next(drawEvent.geometry);
        }
      });
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public measure(type: 'length' | 'area') {
    if (this.toolActive) {
      this.manager?.disableTool(this.toolId);
      this.hideTooltipAndGeom();
      if (this.toolActive === type) {
        this.toolActive = null;
        return;
      }
    }
    this.toolActive = type;
    this.hideTooltipAndGeom();
    this.manager?.enableTool<DrawingEnableToolArguments>(this.toolId, true, {
      type: type === 'area' ? 'area' : 'line',
    });
  }

  private hideTooltipAndGeom() {
    this.featureGeom.next('');
    this.tooltip?.hide();
  }

  private updateTooltip(tooltip: MapTooltipModel | null, coordinates: number[], size?: number) {
    tooltip?.show().setContent(this.formatSize(size)).move(coordinates);
  }

  private formatSize(size?: number) {
    if (!size) {
      return '';
    }
    if (this.toolActive === 'length') {
      return MapSizeHelper.getFormattedLength(size);
    }
    if (this.toolActive === 'area') {
      return HtmlHelper.createElement({
        nodeName: 'div',
        children: [
          { nodeName: 'span', textContent: MapSizeHelper.getFormattedArea(size) },
          { nodeName: 'sup', textContent: '2' },
        ],
      });
    }
    return '';
  }

}
