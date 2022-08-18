import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {
  DrawingToolConfigModel, DrawingToolModel, MapService, MapSizeHelper, MapTooltipModel, ToolTypeEnum,
} from '@tailormap-viewer/map';
import { Subject, switchMap, takeUntil, tap } from 'rxjs';
import { HtmlHelper } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { activateTool, deactivateTool, deregisterTool, registerTool } from '../state/toolbar.actions';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import { selectActiveTool } from '../state/toolbar.selectors';

@Component({
  selector: 'tm-measure',
  templateUrl: './measure.component.html',
  styleUrls: ['./measure.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeasureComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public toolActive: 'length' | 'area' | null = null;
  private featureGeom = new Subject<string>();
  private tooltip: MapTooltipModel | null = null;

  constructor(
    private store$: Store,
    private mapService: MapService,
    private cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit(): void {
    this.store$.select(selectActiveTool)
      .pipe(takeUntil(this.destroyed))
      .subscribe(activeTool => {
        if (activeTool === ToolbarComponentEnum.MEASURE) {
          return;
        }
        this.hideTooltipAndGeom();
        this.toolActive = null;
        this.cdr.detectChanges();
      });

    this.mapService.createTooltip$()
      .pipe(takeUntil(this.destroyed))
      .subscribe(tooltip => this.tooltip = tooltip);

    this.mapService.renderFeatures$('measurement-layer', this.featureGeom.asObservable(), {
      styleKey: 'measurement-style',
      zIndex: 9999,
      strokeColor: '#6236ff',
      strokeWidth: 3,
    }).pipe(takeUntil(this.destroyed)).subscribe();

    this.mapService.createTool$<DrawingToolModel, DrawingToolConfigModel>({
      type: ToolTypeEnum.Draw,
      computeSize: true,
      style: {
        strokeColor: '#6236ff',
        pointFillColor: 'transparent',
        pointStrokeColor: '#6236ff',
      },
    })
      .pipe(
        takeUntil(this.destroyed),
        tap(({ tool }) => {
          this.store$.dispatch(registerTool({ tool: { id: ToolbarComponentEnum.MEASURE, mapToolId: tool.id } }));
        }),
        switchMap(({ tool }) => tool.drawing$),
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
    this.store$.dispatch(deregisterTool({ tool: ToolbarComponentEnum.MEASURE }));
  }

  public measure(type: 'length' | 'area') {
    if (this.toolActive === type) {
      this.hideTooltipAndGeom();
      this.store$.dispatch(deactivateTool({ tool: ToolbarComponentEnum.MEASURE }));
      return;
    }
    this.toolActive = type;
    this.hideTooltipAndGeom();
    this.store$.dispatch(activateTool({ tool: ToolbarComponentEnum.MEASURE, enableArguments: {
      type: type === 'area' ? 'area' : 'line',
    } }));
  }

  private hideTooltipAndGeom() {
    this.featureGeom.next('');
    this.tooltip?.hide();
  }

  private updateTooltip(tooltip: MapTooltipModel | null, coordinates: number[], size?: number) {
    const content = this.formatSize(size);
    if (!content) {
      return;
    }
    tooltip?.show().setContent(content).move(coordinates);
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
