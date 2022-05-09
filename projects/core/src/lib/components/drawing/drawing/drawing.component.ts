import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { DrawingToolConfigModel, DrawingToolModel, DrawingType, MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { filter, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { selectFeatures } from '../state/drawing.selectors';
import { addFeature } from '../state/drawing.actions';
import { DrawingHelper } from '../helpers/drawing.helper';
import { DrawingFeatureTypeEnum } from '../models/drawing-feature-type.enum';
import { MenubarService } from '../../menubar';
import { DrawingMenuButtonComponent } from '../drawing-menu-button/drawing-menu-button.component';

@Component({
  selector: 'tm-drawing',
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  private tool: DrawingToolModel | null = null;
  public activeTool: DrawingFeatureTypeEnum | null = null;

  constructor(
    private store$: Store,
    private mapService: MapService,
    private menubarService: MenubarService,
    private cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit() {
    this.mapService.renderFeatures$('drawing-layer', this.store$.select(selectFeatures), {
      styleKey: 'drawing-style',
      strokeColor: '#6236ff',
      strokeWidth: 3,
    }).pipe(takeUntil(this.destroyed)).subscribe();

    this.mapService.createTool$<DrawingToolModel, DrawingToolConfigModel>({
      type: ToolTypeEnum.Draw,
      computeSize: true,
      strokeColor: '#6236ff',
      pointFillColor: 'transparent',
      pointStrokeColor: '#6236ff',
      drawingType: 'circle',
    })
      .pipe(
        takeUntil(this.destroyed),
        filter(Boolean),
        tap(tool => this.tool = tool),
        switchMap(tool => tool.drawing$),
      )
      .subscribe(drawEvent => {
        if (drawEvent && drawEvent.type === 'end' && this.activeTool) {
          this.store$.dispatch(addFeature({ feature: DrawingHelper.getFeature(this.activeTool, drawEvent.geometry) }));
        }
      });

    this.menubarService.registerComponent(DrawingMenuButtonComponent);
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public drawPoint() {
    this.toggleTool('point', DrawingFeatureTypeEnum.POINT);
  }

  public drawLine() {
    this.toggleTool('line', DrawingFeatureTypeEnum.LINE);
  }

  public drawPolygon() {
    this.toggleTool('area', DrawingFeatureTypeEnum.POLYGON);
  }

  public drawCircle() {
    this.toggleTool('circle', DrawingFeatureTypeEnum.CIRCLE);
  }

  public drawLabel() {
    this.toggleTool('point', DrawingFeatureTypeEnum.POINT);
  }

  private toggleTool(type: DrawingType, drawingFeatureType: DrawingFeatureTypeEnum) {
    if (!this.tool) {
      return;
    }
    if (this.activeTool === drawingFeatureType) {
      this.activeTool = null;
      this.mapService.getToolManager$().pipe(take(1)).subscribe(manager => {
        if (!this.tool) {
          return;
        }
        manager.disableTool(this.tool.id);
      });
      this.tool?.disable();
      return;
    }
    this.activeTool = drawingFeatureType;
    this.mapService.getToolManager$().pipe(take(1)).subscribe(manager => {
      if (!this.tool) {
        return;
      }
      manager.enableTool(this.tool.id, true, { type });
    });
  }

}
