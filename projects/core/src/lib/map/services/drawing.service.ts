import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  DrawingToolConfigModel, DrawingToolEvent, DrawingToolModel, DrawingType, ExtTransformEnableToolArguments, ExtTransformToolConfigModel,
  ExtTransformToolModel, FeatureHelper, MapService, MapStyleModel, SelectToolConfigModel, SelectToolModel, ToolManagerModel, ToolTypeEnum,
} from '@tailormap-viewer/map';
import { BehaviorSubject, Subject, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DrawingFeatureTypeEnum } from '../models/drawing-feature-type.enum';
import { FeatureModel } from '@tailormap-viewer/api';
import { ApplicationStyleService } from '../../services/application-style.service';
import { DrawingFeatureModelAttributes, DrawingFeatureStyleModel } from '../models/drawing-feature.model';
import { DrawingHelper } from '../helpers/drawing.helper';

@Injectable()
export class DrawingService {
  private mapService = inject(MapService);
  private destroyRef = inject(DestroyRef);

  private activeDrawingTool: DrawingFeatureTypeEnum | null = null;
  private drawingTool: DrawingToolModel | null = null;
  private selectTool: SelectToolModel | null = null;
  private extTransformTool: ExtTransformToolModel | null = null;

  private drawingAdded = new Subject<DrawingToolEvent>();
  private featureSelected = new Subject<FeatureModel | null>();
  private featureGeometryModified = new Subject<string>();
  private activeToolChanged = new Subject<DrawingFeatureTypeEnum | null>();
  private selectToolActive = new BehaviorSubject<boolean>(false);
  private drawingResetCalled = new Subject();
  private predefinedStyleSelected = new BehaviorSubject<DrawingFeatureStyleModel | null>(null);

  public drawingAdded$ = this.drawingAdded.asObservable();
  public featureSelected$ = this.featureSelected.asObservable();
  public featureGeometryModified$ = this.featureGeometryModified.asObservable();
  public activeToolChanged$ = this.activeToolChanged.asObservable();
  public selectToolActive$ = this.selectToolActive.asObservable();
  public drawingResetCalled$ = this.drawingResetCalled.asObservable();
  public predefinedStyleSelected$ = this.predefinedStyleSelected.asObservable();

  private selectedFeature: FeatureModel | null = null;
  public isSelectedFeaturePointGeometry = false;

  public SIZE_MIN = 10000;
  public SIZE_MAX = 1;
  public customRectangleWidth = signal<number | null>(null);
  public customRectangleLength = signal<number | null>(null);
  public customSquareLength = signal<number | null>(null);
  public customCircleRadius = signal<number | null>(null);

  public lockedStyle = signal<boolean>(false);
  public style = signal<DrawingFeatureStyleModel>(DrawingHelper.getUpdatedDefaultStyle());
  public showMeasures = signal<boolean>(false);

  private static getDefaultStyle = (): Partial<MapStyleModel> => ({
    pointType: 'circle',
    strokeColor: ApplicationStyleService.getPrimaryColor(),
    pointFillColor: 'transparent',
    pointStrokeColor: ApplicationStyleService.getPrimaryColor(),
  });

  private selectionStyle: Partial<MapStyleModel> | ((feature: FeatureModel) => MapStyleModel) | undefined;
  private toolManager: ToolManagerModel | undefined;

  constructor() {
    const toolManager$ = this.mapService.getToolManager$()
      .pipe(takeUntilDestroyed(this.destroyRef));
    toolManager$.subscribe(toolManager => this.toolManager = toolManager);
    toolManager$
      .pipe(switchMap(toolManager => toolManager.getToolsDisabled$()))
      .subscribe(({ disabledTools, enabledTools }) => {
        if (this.drawingTool && this.activeDrawingTool !== null && disabledTools.includes(this.drawingTool.id)) {
          // Drawing tool is disabled while drawing (probably because of other tool activation)
          this.featureSelected.next(null);
          this.enableSelectAndModify(false);
        }
        if (this.extTransformTool && this.selectedFeature !== null && disabledTools.includes(this.extTransformTool.id)) {
          // Transform tool is disabled while we have a selected feature, unselect feature to keep it visible
          this.featureSelected.next(null);
        }
        if (this.selectTool) {
          this.selectToolActive.next(enabledTools.includes(this.selectTool.id));
        }
      });
  }

  public createDrawingTools(opts: {
    drawingLayerId: string;
    drawSingleShape?: boolean;
    selectionStyle?: Partial<MapStyleModel> | ((feature: FeatureModel) => MapStyleModel);
  }) {
    if (this.drawingTool) {
      return;
    }
    this.selectionStyle = opts.selectionStyle;
    this.mapService.createTool$<DrawingToolModel, DrawingToolConfigModel>({
      type: ToolTypeEnum.Draw,
      style: DrawingService.getDefaultStyle(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(({ tool }) => this.drawingTool = tool),
        switchMap(({ tool }) => tool.drawing$),
      )
      .subscribe(drawEvent => {
        if (drawEvent && drawEvent.type === 'end' && this.activeDrawingTool) {
          this.drawingAdded.next({
            ...drawEvent,
            geometry: this.applyFixedSize(drawEvent.geometry),
          });
          if (opts.drawSingleShape) {
            const activeTool = this.activeDrawingTool;
            setTimeout(() => {
              this.toggleTool(DrawingService.drawingFeatureTypeToDrawingType(activeTool), activeTool);
            }, 100);
          }
        }
      });

    this.mapService.createTool$<SelectToolModel, SelectToolConfigModel>({
      type: ToolTypeEnum.Select,
      layers: [opts.drawingLayerId],
      style: opts.selectionStyle || DrawingService.getDefaultStyle(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(({ tool, manager }) => {
          this.selectTool = tool;
          manager.enableTool(tool.id, true);
        }),
        switchMap(({ tool }) => tool.selectedFeatures$),
      )
      .subscribe(selectedFeatures => {
        const selectedFeature = selectedFeatures && selectedFeatures.length > 0 && selectedFeatures[0] ? selectedFeatures[0] : null;
        this.featureSelected.next(selectedFeature);
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

    this.mapService.createTool$<ExtTransformToolModel, ExtTransformToolConfigModel>({
      type: ToolTypeEnum.ExtTransform,
      style,
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(({ tool }) => {
        this.extTransformTool = tool;
      }),
      switchMap(({ tool }) => tool.featureModified$),
    ).subscribe(modifiedGeometry => {
      this.featureGeometryModified.next(modifiedGeometry);
    });
  }

  public disableDrawingTools() {
    if (this.drawingTool) {
      this.toolManager?.disableTool(this.drawingTool.id);
    }
    if (this.selectTool) {
      this.toolManager?.disableTool(this.selectTool.id);
    }
    if (this.extTransformTool) {
      this.toolManager?.disableTool(this.extTransformTool.id, true);
    }
    this.activeDrawingTool = null;
  }

  public toggle(type: DrawingFeatureTypeEnum, forceEnableDrawing?: boolean) {
    this.toggleTool(DrawingService.drawingFeatureTypeToDrawingType(type), type, forceEnableDrawing);
  }

  public setSelectedFeature(feature: FeatureModel | null) {
    this.selectedFeature = feature;
    this.isSelectedFeaturePointGeometry = feature?.geometry?.trim().startsWith('POINT') ?? false;
    this.setSelectedFeatureInSelectTool(feature);
    this.enableModifyTool();
  }

  public enableSelectAndModify(disableOtherTools: boolean = true) {
    this.disableDrawing(disableOtherTools);
    this.enableModifyTool();
  }
  public getActiveTool() {
    return this.activeDrawingTool;
  }

  private static allPolygonDrawingTypes: DrawingFeatureTypeEnum[] = [
    DrawingFeatureTypeEnum.POLYGON,
    DrawingFeatureTypeEnum.SQUARE,
    DrawingFeatureTypeEnum.SQUARE_SPECIFIED_LENGTH,
    DrawingFeatureTypeEnum.RECTANGLE,
    DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE,
    DrawingFeatureTypeEnum.CIRCLE,
    DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS,
    DrawingFeatureTypeEnum.ELLIPSE,
  ];

  private static polygonDrawingTypes: DrawingFeatureTypeEnum[] = [
    DrawingFeatureTypeEnum.POLYGON,
    DrawingFeatureTypeEnum.SQUARE,
    DrawingFeatureTypeEnum.RECTANGLE,
    DrawingFeatureTypeEnum.CIRCLE,
    DrawingFeatureTypeEnum.ELLIPSE,
  ];

  public resetBeforeDrawing(nextDrawingType?: DrawingFeatureTypeEnum) {
    if (this.predefinedStyleSelected.value && this.activeDrawingTool && nextDrawingType) {
      if (DrawingService.allPolygonDrawingTypes.includes(this.activeDrawingTool) && DrawingService.polygonDrawingTypes.includes(nextDrawingType)) {
        return;
      }
    }

    const defaultNonUserEditableStyle: Partial<DrawingFeatureStyleModel> = {
      description: undefined,
      secondaryStroke: undefined,
      tertiaryStroke: undefined,
      dashOffset: 0,
      strokeOffset: 0,
    };
    DrawingHelper.updateDefaultStyle(defaultNonUserEditableStyle);
    this.style.set(DrawingHelper.getUpdatedDefaultStyle());
    this.predefinedStyleSelected.next(null);
    this.lockedStyle.set(false);
    this.drawingResetCalled.next(null);
  }

  public setPredefinedStyle(style: DrawingFeatureModelAttributes) {
    this.predefinedStyleSelected.next(style.style);
    this.style.set({
      ...DrawingHelper.getDefaultStyle(),
      ...style.style,
      markerSize: style.type === DrawingFeatureTypeEnum.IMAGE ? 100 : undefined,
      label: '',
    });
    this.lockedStyle.set(style.lockedStyle ?? false);
    if (style.type === DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE && style.rectangleSize) {
      this.customRectangleWidth.set(style.rectangleSize.width);
      this.customRectangleLength.set(style.rectangleSize.height);
    }
    if (style.type === DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS && style.circleRadius) {
      this.customCircleRadius.set(style.circleRadius);
    }
    if (style.type === DrawingFeatureTypeEnum.SQUARE_SPECIFIED_LENGTH && style.squareLength) {
      this.customSquareLength.set(style.squareLength);
    }
    if (this.getActiveTool() !== style.type) {
      const compatibleDrawingType = this.activeDrawingTool != null
        && DrawingService.polygonDrawingTypes.includes(style.type) && DrawingService.allPolygonDrawingTypes.includes(this.activeDrawingTool);

      if (!compatibleDrawingType) {
        this.toggle(style.type);
      }
    }
  }

  private applyFixedSize(geometry: string): string {
    const customRectangleWidth = this.customRectangleWidth();
    const customRectangleLength = this.customRectangleLength();
    if (this.activeDrawingTool == DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE && customRectangleWidth != null && customRectangleLength != null && geometry) {
      const rectangle = FeatureHelper.createRectangleAtPoint(geometry, customRectangleWidth, customRectangleLength);
      if (rectangle) {
        return rectangle;
      }
    }
    const customCircleRadius = this.customCircleRadius();
    if (this.activeDrawingTool === DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS && customCircleRadius != null && geometry) {
      const circle = FeatureHelper.createCircleAtPoint(geometry, customCircleRadius);
      if (circle) {
        return circle;
      }
    }
    const customSquareLength = this.customSquareLength();
    if (this.activeDrawingTool === DrawingFeatureTypeEnum.SQUARE_SPECIFIED_LENGTH && customSquareLength != null && geometry) {
      const square = FeatureHelper.createRectangleAtPoint(geometry, customSquareLength, customSquareLength);
      if (square) {
        return square;
      }
    }
    return geometry;
  }

  private toggleTool(type: DrawingType, drawingFeatureType: DrawingFeatureTypeEnum, forceEnableDrawing?: boolean) {
    if (!this.drawingTool || !this.selectTool) {
      return;
    }
    if (this.activeDrawingTool === drawingFeatureType && !forceEnableDrawing) {
      this.disableDrawing();
      this.enableModifyTool();
    } else {
      // Enable drawing
      this.activeDrawingTool = drawingFeatureType;
      const style: MapStyleModel = this.showMeasures() ? { showTotalSize: true, showSegmentSize: true } : {};
      this.toolManager?.enableTool(this.drawingTool.id, true, { type, style }, true);
      this.toolManager?.disableTool(this.selectTool.id, true);
      if (this.extTransformTool) {
        this.toolManager?.disableTool(this.extTransformTool.id, true);
      }
      this.featureSelected.next(null);
      this.activeToolChanged.next(this.activeDrawingTool);
    }
  }

  private disableDrawing(disableOtherTools = true) {
    if (!this.drawingTool || !this.selectTool) {
      return;
    }
    this.activeDrawingTool = null;
    this.toolManager?.disableTool(this.drawingTool.id, true);
    this.toolManager?.enableTool(this.selectTool.id, disableOtherTools);
    this.activeToolChanged.next(this.activeDrawingTool);
  }

  private enableModifyTool() {
    if (!this.extTransformTool) {
      return;
    }
    if (this.selectedFeature) {
      const enableArgs: ExtTransformEnableToolArguments = {
        feature: this.selectedFeature,
        style: this.selectionStyle,
      };
      this.toolManager?.enableTool(this.extTransformTool?.id || '', false, enableArgs, true);
    } else {
      this.toolManager?.disableTool(this.extTransformTool?.id || '', true);
    }
  }

  private setSelectedFeatureInSelectTool(feature: FeatureModel | null) {
    if (!this.selectTool) {
      return;
    }
    this.toolManager?.getTool<SelectToolModel>(this.selectTool.id)?.setSelectedFeature(feature);
  }

  private static drawingFeatureTypeToDrawingType(type: DrawingFeatureTypeEnum): DrawingType {
    const dict: { [key in DrawingFeatureTypeEnum]: DrawingType } = {
      [DrawingFeatureTypeEnum.POINT]: 'point',
      [DrawingFeatureTypeEnum.LABEL]: 'point',
      [DrawingFeatureTypeEnum.LINE]: 'line',
      [DrawingFeatureTypeEnum.POLYGON]: 'area',
      [DrawingFeatureTypeEnum.CIRCLE]: 'circle',
      [DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS]: 'point',
      [DrawingFeatureTypeEnum.SQUARE]: 'square',
      [DrawingFeatureTypeEnum.SQUARE_SPECIFIED_LENGTH]: 'point',
      [DrawingFeatureTypeEnum.RECTANGLE]: 'rectangle',
      [DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE]: 'point',
      [DrawingFeatureTypeEnum.ELLIPSE]: 'ellipse',
      [DrawingFeatureTypeEnum.STAR]: 'star',
      [DrawingFeatureTypeEnum.IMAGE]: 'point',
    };
    return dict[type];
  }

}
