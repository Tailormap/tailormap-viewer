import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import {
  DrawingToolConfigModel, DrawingToolModel, DrawingType, MapService, SelectToolConfigModel, SelectToolModel, ToolTypeEnum,
} from '@tailormap-viewer/map';
import { Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { addFeature, setSelectedDrawingStyle, setSelectedFeature } from '../state/drawing.actions';
import { DrawingHelper } from '../helpers/drawing.helper';
import { DrawingFeatureModelAttributes } from '../models/drawing-feature.model';
import { Store } from '@ngrx/store';
import { DrawingFeatureTypeEnum } from '../models/drawing-feature-type.enum';

@Component({
  selector: 'tm-create-drawing-button',
  templateUrl: './create-drawing-button.component.html',
  styleUrls: ['./create-drawing-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateDrawingButtonComponent implements OnInit, OnDestroy {

  @Input()
  public drawingLayerId = '';

  private destroyed = new Subject();
  private tool: DrawingToolModel | null = null;
  public activeTool: DrawingFeatureTypeEnum | null = null;
  private selectTool: SelectToolModel<DrawingFeatureModelAttributes> | null = null;

  constructor(
    private store$: Store,
    private mapService: MapService,
  ) { }

  public ngOnInit(): void {
    this.mapService.createTool$<DrawingToolModel, DrawingToolConfigModel>({
      type: ToolTypeEnum.Draw,
      computeSize: true,
      style: {
        pointType: 'circle',
        strokeColor: '#6236ff',
        pointFillColor: 'transparent',
        pointStrokeColor: '#6236ff',
      },
    })
      .pipe(
        takeUntil(this.destroyed),
        tap(({ tool }) => this.tool = tool),
        switchMap(({ tool }) => tool.drawing$),
      )
      .subscribe(drawEvent => {
        if (drawEvent && drawEvent.type === 'end' && this.activeTool) {
          this.store$.dispatch(addFeature({ feature: DrawingHelper.getFeature(this.activeTool, drawEvent), selectFeature: true }));
        }
      });

    this.mapService.createTool$<SelectToolModel<DrawingFeatureModelAttributes>, SelectToolConfigModel<DrawingFeatureModelAttributes>>({
      type: ToolTypeEnum.Select,
      layers: [this.drawingLayerId],
      style: DrawingHelper.applyDrawingStyle,
    })
      .pipe(
        takeUntil(this.destroyed),
        tap(({ tool, manager }) => {
          this.selectTool = tool;
          manager.enableTool(tool.id, true);
        }),
        switchMap(({ tool }) => tool.selectedFeatures$),
      )
      .subscribe(selectedFeatures => {
        const selectedFeature = selectedFeatures && selectedFeatures.length > 0 && selectedFeatures[0] ? selectedFeatures[0].__fid : null;
        this.store$.dispatch(setSelectedFeature({ fid: selectedFeature || null }));
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
    this.store$.dispatch(setSelectedFeature({ fid: null }));
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
    this.toggleTool('point', DrawingFeatureTypeEnum.LABEL);
  }

  private toggleTool(type: DrawingType, drawingFeatureType: DrawingFeatureTypeEnum) {
    this.store$.dispatch(setSelectedDrawingStyle({ drawingType: this.activeTool === drawingFeatureType ? null : drawingFeatureType }));
    this.mapService.getToolManager$().pipe(take(1)).subscribe(manager => {
      if (!this.tool || !this.selectTool) {
        return;
      }
      if (this.activeTool === drawingFeatureType) {
        this.activeTool = null;
        manager.disableTool(this.tool.id, true);
        manager.enableTool(this.selectTool.id, true);
        return;
      }
      this.activeTool = drawingFeatureType;
      manager.enableTool(this.tool.id, true, { type });
      manager.disableTool(this.selectTool.id, true);
    });
  }

}
