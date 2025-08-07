import { DestroyRef, Injectable, inject } from '@angular/core';
import {
  DrawingToolConfigModel, DrawingToolEvent, DrawingToolModel, DrawingType, ExtTransformEnableToolArguments, ExtTransformToolConfigModel,
  ExtTransformToolModel, MapService,
  MapStyleModel,
  SelectToolConfigModel, SelectToolModel, ToolManagerModel,
  ToolTypeEnum,
} from '@tailormap-viewer/map';
import { BehaviorSubject, Subject, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DrawingFeatureTypeEnum } from '../models/drawing-feature-type.enum';
import { FeatureModel } from '@tailormap-viewer/api';
import { ApplicationStyleService } from '../../services/application-style.service';

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

  public drawingAdded$ = this.drawingAdded.asObservable();
  public featureSelected$ = this.featureSelected.asObservable();
  public featureGeometryModified$ = this.featureGeometryModified.asObservable();
  public activeToolChanged$ = this.activeToolChanged.asObservable();
  public selectToolActive$ = this.selectToolActive.asObservable();

  private selectedFeature: FeatureModel | null = null;
  public isSelectedFeaturePointGeometry = false;

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
          this.drawingAdded.next(drawEvent);
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

  public toggle(type: DrawingFeatureTypeEnum, showMeasures?: boolean, forceEnableDrawing?: boolean) {
    this.toggleTool(DrawingService.drawingFeatureTypeToDrawingType(type), type, showMeasures, forceEnableDrawing);
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

  private toggleTool(type: DrawingType, drawingFeatureType: DrawingFeatureTypeEnum, showMeasures?: boolean, forceEnableDrawing?: boolean) {
    if (!this.drawingTool || !this.selectTool) {
      return;
    }
    if (this.activeDrawingTool === drawingFeatureType && !forceEnableDrawing) {
      this.disableDrawing();
      this.enableModifyTool();
    } else {
      // Enable drawing
      this.activeDrawingTool = drawingFeatureType;
      const style: MapStyleModel = showMeasures ? { showTotalSize: true, showSegmentSize: true } : {};
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
