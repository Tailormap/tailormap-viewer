import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import {
  DrawingToolConfigModel, DrawingToolEvent, DrawingToolModel, DrawingType, MapService, MapStyleModel, SelectToolConfigModel,
  SelectToolModel, ToolTypeEnum,
} from '@tailormap-viewer/map';
import { DrawingFeatureTypeEnum } from '../../models/drawing-feature-type.enum';
import { FeatureModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-map-drawing-buttons',
  templateUrl: './map-drawing-buttons.component.html',
  styleUrls: ['./map-drawing-buttons.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapDrawingButtonsComponent implements OnInit, OnDestroy {

  private static DEFAULT_STYLE: Partial<MapStyleModel> = {
    pointType: 'circle',
    strokeColor: '#6236ff',
    pointFillColor: 'transparent',
    pointStrokeColor: '#6236ff',
  };

  @Input()
  public drawingLayerId = '';

  @Input()
  public selectionStyle: Partial<MapStyleModel> | ((feature: FeatureModel) => MapStyleModel) | undefined = undefined;

  @Input()
  public drawSingleShape = false;

  @Input()
  public allowRemoveSelectedFeature = false;

  @Input()
  public allowedShapes: DrawingFeatureTypeEnum[] | undefined = undefined;

  @Output()
  public drawingAdded: EventEmitter<DrawingToolEvent> = new EventEmitter<DrawingToolEvent>();

  @Output()
  public featureRemoved: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  public featureSelected: EventEmitter<string | null> = new EventEmitter<string | null>();

  @Output()
  public activeToolChanged: EventEmitter<DrawingFeatureTypeEnum | null> = new EventEmitter<DrawingFeatureTypeEnum | null>();

  public drawingTypes = DrawingFeatureTypeEnum;

  private destroyed = new Subject();
  private tool: DrawingToolModel | null = null;
  public activeTool: DrawingFeatureTypeEnum | null = null;
  private selectTool: SelectToolModel | null = null;

  public selectedFeatureId: string | null = null;

  constructor(
    private mapService: MapService,
    private cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit(): void {
    this.mapService.createTool$<DrawingToolModel, DrawingToolConfigModel>({
      type: ToolTypeEnum.Draw,
      computeSize: false,
      style: MapDrawingButtonsComponent.DEFAULT_STYLE,
    })
      .pipe(
        takeUntil(this.destroyed),
        tap(({ tool }) => this.tool = tool),
        switchMap(({ tool }) => tool.drawing$),
      )
      .subscribe(drawEvent => {
        if (drawEvent && drawEvent.type === 'end' && this.activeTool) {
          this.drawingAdded.emit(drawEvent);
          if (this.drawSingleShape) {
            const activeTool = this.activeTool;
            setTimeout(() => {
              this.toggleTool(this.drawingFeatureTypeToDrawingType(activeTool), activeTool);
            }, 100);
          }
        }
      });

    this.mapService.createTool$<SelectToolModel, SelectToolConfigModel>({
      type: ToolTypeEnum.Select,
      layers: [this.drawingLayerId],
      style: this.selectionStyle || MapDrawingButtonsComponent.DEFAULT_STYLE,
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
        this.selectedFeatureId = selectedFeature;
        this.cdr.detectChanges();
        this.featureSelected.emit(selectedFeature);
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public draw(type: DrawingFeatureTypeEnum) {
    this.toggleTool(this.drawingFeatureTypeToDrawingType(type), type);
  }

  public isAllowedShape(type: DrawingFeatureTypeEnum) {
    return !this.allowedShapes || this.allowedShapes.includes(type);
  }

  private drawingFeatureTypeToDrawingType(type: DrawingFeatureTypeEnum): DrawingType {
    const dict: { [key in DrawingFeatureTypeEnum]: DrawingType } = {
      [DrawingFeatureTypeEnum.POINT]: 'point',
      [DrawingFeatureTypeEnum.LABEL]: 'point',
      [DrawingFeatureTypeEnum.LINE]: 'line',
      [DrawingFeatureTypeEnum.POLYGON]: 'area',
      [DrawingFeatureTypeEnum.CIRCLE]: 'circle',
      [DrawingFeatureTypeEnum.SQUARE]: 'square',
      [DrawingFeatureTypeEnum.RECTANGLE]: 'rectangle',
      [DrawingFeatureTypeEnum.ELLIPSE]: 'ellipse',
      [DrawingFeatureTypeEnum.STAR]: 'star',
    };
    return dict[type];
  }

  private toggleTool(type: DrawingType, drawingFeatureType: DrawingFeatureTypeEnum) {
    this.activeToolChanged.emit(this.activeTool === drawingFeatureType ? null : drawingFeatureType);
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

  public removeSelectedFeature() {
    if (!this.selectedFeatureId) {
      return;
    }
    this.featureRemoved.emit(this.selectedFeatureId);
    this.selectedFeatureId = null;
  }

}
