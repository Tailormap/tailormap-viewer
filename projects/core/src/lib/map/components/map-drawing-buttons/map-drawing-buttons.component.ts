import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import {
  DrawingToolConfigModel, DrawingToolEvent, DrawingToolModel, DrawingType, ExtTransformEnableToolArguments, ExtTransformToolConfigModel,
  ExtTransformToolModel, MapService,
  MapStyleModel,
  SelectToolConfigModel,
  SelectToolModel, ToolManagerModel, ToolTypeEnum,
} from '@tailormap-viewer/map';
import { DrawingFeatureTypeEnum } from '../../models/drawing-feature-type.enum';
import { FeatureModel } from '@tailormap-viewer/api';
import { ApplicationStyleService } from '../../../services/application-style.service';

@Component({
  selector: 'tm-map-drawing-buttons',
  templateUrl: './map-drawing-buttons.component.html',
  styleUrls: ['./map-drawing-buttons.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MapDrawingButtonsComponent implements OnInit, OnDestroy {

  private static getDefaultStyle = (): Partial<MapStyleModel> => ({
    pointType: 'circle',
    strokeColor: ApplicationStyleService.getPrimaryColor(),
    pointFillColor: 'transparent',
    pointStrokeColor: ApplicationStyleService.getPrimaryColor(),
  });

  @Input()
  public drawingLayerId = '';

  private _selectedFeature: FeatureModel | null = null;
  public isSelectedFeaturePointGeometry = false;

  @Input()
  public set selectedFeature(value: FeatureModel | null) {
    this._selectedFeature = value;
    this.isSelectedFeaturePointGeometry = value?.geometry?.trim().startsWith('POINT') ?? false;
    this.enableModifyTool();
  }
  public get selectedFeature(): FeatureModel | null {
    return this._selectedFeature;
  }

  @Input()
  public selectionStyle: Partial<MapStyleModel> | ((feature: FeatureModel) => MapStyleModel) | undefined = undefined;

  @Input()
  public drawSingleShape = false;

  @Input()
  public allowRemoveSelectedFeature = false;

  @Input()
  public allowModify = false;

  @Input()
  public showSelectButton = true;

  @Input()
  public allowedShapes: DrawingFeatureTypeEnum[] | undefined = undefined;

  @Output()
  public drawingAdded: EventEmitter<DrawingToolEvent> = new EventEmitter<DrawingToolEvent>();

  @Output()
  public featureGeometryModified: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  public featureRemoved: EventEmitter<FeatureModel> = new EventEmitter<FeatureModel>();

  @Output()
  public featureSelected: EventEmitter<FeatureModel | null> = new EventEmitter<FeatureModel | null>();

  @Output()
  public activeToolChanged: EventEmitter<DrawingFeatureTypeEnum | null> = new EventEmitter<DrawingFeatureTypeEnum | null>();

  public drawingTypes = DrawingFeatureTypeEnum;

  private destroyed = new Subject();
  private tool: DrawingToolModel | null = null;
  public activeTool: DrawingFeatureTypeEnum | null = null;
  private selectTool: SelectToolModel | null = null;
  private extTransformTool: ExtTransformToolModel | null = null;

  constructor(
    private mapService: MapService,
    private cdr: ChangeDetectorRef,
  ) {
  }

  private withToolManager(
    callback: (manager: ToolManagerModel) => void,
  ) {
    this.mapService.getToolManager$().pipe(take(1)).subscribe(manager => {
      callback(manager);
    });
  }

  public ngOnInit(): void {
    this.mapService.createTool$<DrawingToolModel, DrawingToolConfigModel>({
      type: ToolTypeEnum.Draw,
      computeSize: false,
      style: MapDrawingButtonsComponent.getDefaultStyle(),
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
      style: this.selectionStyle || MapDrawingButtonsComponent.getDefaultStyle(),
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
        const selectedFeature = selectedFeatures && selectedFeatures.length > 0 && selectedFeatures[0] ? selectedFeatures[0] : null;
        this.cdr.detectChanges();
        this.featureSelected.emit(selectedFeature);
      });

    const style: MapStyleModel = {
      styleKey: 'edit-geometry-style',
      zIndex: 100,
      pointType: 'circle',
      pointStrokeColor: ApplicationStyleService.getPrimaryColor(),
      strokeColor: ApplicationStyleService.getPrimaryColor(),
      strokeType: 'dash',
      strokeWidth: 2,
      pointFillColor: 'transparent',
      fillColor: ApplicationStyleService.getPrimaryColor(), // Must specify color otherwise no hand cursor
      fillOpacity: 0,
    };

    if (this.allowModify) {
      this.mapService.createTool$<ExtTransformToolModel, ExtTransformToolConfigModel>({
        type: ToolTypeEnum.ExtTransform,
        style,
      }).pipe(
        takeUntil(this.destroyed),
        tap(({ tool }) => {
          this.extTransformTool = tool;
        }),
        switchMap(({ tool }) => tool.featureModified$),
      ).subscribe(modifiedGeometry => {
        this.featureGeometryModified.emit(modifiedGeometry);
      });
    }
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
    this.withToolManager(manager => {
      if (!this.tool || !this.selectTool) {
        return;
      }
      if (this.activeTool === drawingFeatureType) {
        this.disableDrawing();
        this.enableModifyTool();
      } else {
        // Enable drawing
        this.activeTool = drawingFeatureType;
        manager.enableTool(this.tool.id, true, { type });
        manager.disableTool(this.selectTool.id, true);
        if (this.extTransformTool) {
          manager.disableTool(this.extTransformTool.id, true);
        }
        this.featureSelected.emit(null);
        this.activeToolChanged.emit(this.activeTool);
      }
    });
  }

  private disableDrawing(disableOtherTools = true) {
    if (this.activeTool === null) {
      return;
    }
    this.withToolManager(manager => {
      if (!this.tool || !this.selectTool) {
        return;
      }
      this.activeTool = null;
      manager.disableTool(this.tool.id, true);
      manager.enableTool(this.selectTool.id, disableOtherTools);
      this.activeToolChanged.emit(this.activeTool);
    });
  }

  public removeSelectedFeature() {
    if (!this._selectedFeature) {
      return;
    }
    this.featureRemoved.emit(this._selectedFeature);
  }

  private enableModifyTool() {
    if (!this.allowModify) {
      return;
    }
    this.withToolManager(manager => {
      if (this._selectedFeature) {
        const enableArgs: ExtTransformEnableToolArguments = {
          feature: this._selectedFeature,
          style: this.selectionStyle,
        };
        manager.enableTool(this.extTransformTool?.id || '', false, enableArgs, true);
      } else {
        manager.disableTool(this.extTransformTool?.id || '', true);
      }
    });
  }

  public enableSelectAndModify() {
    this.disableDrawing(false);
    this.enableModifyTool();
  }

}
