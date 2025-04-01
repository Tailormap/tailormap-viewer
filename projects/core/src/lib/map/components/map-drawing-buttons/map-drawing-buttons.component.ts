import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import {
  DrawingToolConfigModel, DrawingToolEvent, DrawingToolModel, DrawingType, MapService, MapStyleModel, ModifyToolConfigModel,
  ModifyToolModel,
  SelectToolConfigModel,
  SelectToolModel, ToolTypeEnum,
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
  public featureModified = new EventEmitter<{ fid: string; geometry: string }>();

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
  private modifyTool: ModifyToolModel | null = null;

  public selectedFeatureId: string | null = null;

  constructor(
    private mapService: MapService,
    private cdr: ChangeDetectorRef,
  ) { }

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
        this.selectedFeatureId = selectedFeature?.__fid || null;
        if (selectedFeature) {
          this.mapService.getToolManager$().pipe(take(1)).subscribe(manager => {
            if (!this.tool || !this.selectTool || !this.modifyTool) {
              return;
            }
            manager.enableTool(this.modifyTool.id, false, { geometry: selectedFeature.geometry });
            console.log('Enabled modify tool for feature:', selectedFeature);
          });
        }
        this.cdr.detectChanges();
        this.featureSelected.emit(this.selectedFeatureId);
      });

    const style: MapStyleModel = {
      styleKey: 'edit-geometry-style',
      zIndex: 100,
      pointType: 'circle',
      pointStrokeColor: ApplicationStyleService.getPrimaryColor(),
      strokeColor: ApplicationStyleService.getPrimaryColor(),
      strokeWidth: 5,
      pointFillColor: 'transparent',
      fillColor: ApplicationStyleService.getPrimaryColor(),
      fillOpacity: 10,
    };

    this.mapService.createTool$<ModifyToolModel, ModifyToolConfigModel>({
      type: ToolTypeEnum.Modify,
      style,
    }).pipe(
      takeUntil(this.destroyed),
      tap(({ tool }) => {
        this.modifyTool = tool;
      }),
      switchMap(({ tool }) => tool.featureModified$),
    ).subscribe(modifiedGeometry => {
      if (!this.selectedFeatureId) {
        return;
      }
      console.log(`Modified geometry for ${this.selectedFeatureId}:`, modifiedGeometry);
      this.featureModified.emit({ fid: this.selectedFeatureId, geometry: modifiedGeometry });
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
      if (!this.tool || !this.selectTool || !this.modifyTool) {
        return;
      }
      if (this.activeTool === drawingFeatureType) {
        this.activeTool = null;
        manager.disableTool(this.tool.id, true);
        manager.enableTool(this.selectTool.id, true);
        // manager.disableTool(this.selectTool.id, true);
        // manager.enableTool(this.modifyTool.id, false, { geometry: null });
        // console.log('Enabled modify tool');
        return;
      }
      this.activeTool = drawingFeatureType;
      manager.enableTool(this.tool.id, true, { type });
      manager.disableTool(this.selectTool.id, true);
      manager.disableTool(this.modifyTool.id, true);
      // console.log('Disabled select and modify tools');
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
