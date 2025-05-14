import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { DrawingToolEvent, FeatureHelper, MapService, MapStyleModel } from '@tailormap-viewer/map';
import { combineLatest, filter, Observable, of, Subject, take, takeUntil, tap } from 'rxjs';
import {
  selectDrawingFeatures, selectDrawingFeaturesExcludingSelected, selectHasDrawingFeatures, selectSelectedDrawingFeature,
  selectSelectedDrawingStyle,
} from '../state/drawing.selectors';
import { DrawingHelper } from '../helpers/drawing.helper';
import { MenubarService } from '../../menubar';
import { DrawingMenuButtonComponent } from '../drawing-menu-button/drawing-menu-button.component';
import { DrawingFeatureModel, DrawingFeatureModelAttributes, DrawingFeatureStyleModel } from '../models/drawing-feature.model';
import {
  addFeature, removeAllDrawingFeatures, removeDrawingFeature, setSelectedDrawingStyle, setSelectedFeature, updateDrawingFeatureStyle,
  updateSelectedDrawingFeatureGeometry,
} from '../state/drawing.actions';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { BaseComponentTypeEnum, FeatureModel } from '@tailormap-viewer/api';
import { DrawingService } from '../../../map/services/drawing.service';

enum CustomSizedDrawingToolEnum {
  CUSTOM_RECTANGLE = 'CUSTOM_RECTANGLE',
  CUSTOM_CIRCLE = 'CUSTOM_CIRCLE',
}

type SpecificDrawingFeatureTypeEnum = DrawingFeatureTypeEnum | CustomSizedDrawingToolEnum;

@Component({
  selector: 'tm-drawing',
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  providers: [
    DrawingService,
  ],
})
export class DrawingComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public drawingLayerId = 'drawing-layer';
  public active$: Observable<boolean> = of(false);
  public selectedFeature: DrawingFeatureModel | null = null;
  public style: DrawingFeatureStyleModel = DrawingHelper.getDefaultStyle();
  public selectedDrawingStyle: DrawingFeatureTypeEnum | null = null;
  public hasFeatures$: Observable<boolean> = of(false);

  public drawingTypes = DrawingFeatureTypeEnum;
  public activeTool: DrawingFeatureTypeEnum | null = null;

  public activeSpecificTool: SpecificDrawingFeatureTypeEnum | null = null;

  public selectionStyle = DrawingHelper.applyDrawingStyle as ((feature: FeatureModel) => MapStyleModel);

  constructor(
    private store$: Store,
    private mapService: MapService,
    private menubarService: MenubarService,
    private confirmService: ConfirmDialogService,
    private drawingService: DrawingService,
    private cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit() {
    this.active$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.DRAWING).pipe(
      tap(visible => {
        if (!visible) {
          this.store$.dispatch(setSelectedFeature({ fid: null }));
          this.activeTool = null;
          this.activeSpecificTool = null;
          this.drawingService.disableDrawingTools();
        } else {
          this.enableSelectAndModify();
        }
      }),
    );
    this.hasFeatures$ = this.store$.select(selectHasDrawingFeatures);

    this.mapService.renderFeatures$<DrawingFeatureModelAttributes>(
      this.drawingLayerId,
      this.store$.select(selectDrawingFeaturesExcludingSelected),
      DrawingHelper.applyDrawingStyle,
    ).pipe(takeUntil(this.destroyed)).subscribe();

    combineLatest([
      this.store$.select(selectSelectedDrawingStyle),
      this.store$.select(selectSelectedDrawingFeature),
    ])
      .pipe(takeUntil(this.destroyed))
      .subscribe(([ style, feature ]) => {
        this.selectedDrawingStyle = style || feature?.attributes.type || null;
        this.selectedFeature = feature;
        this.style = feature
          ? feature.attributes.style
          : DrawingHelper.getDefaultStyle();
        this.cdr.detectChanges();
      });

    this.menubarService.registerComponent({ type: BaseComponentTypeEnum.DRAWING, component: DrawingMenuButtonComponent });
    this.drawingService.createDrawingTools({
      drawingLayerId: this.drawingLayerId,
      selectionStyle: this.selectionStyle,
    });
    this.store$.select(selectSelectedDrawingFeature)
      .pipe(takeUntil(this.destroyed))
      .subscribe(selectedFeature => {
        this.drawingService.setSelectedFeature(selectedFeature);
      });
    this.drawingService.drawingAdded$
      .pipe(takeUntil(this.destroyed))
      .subscribe(e => this.onDrawingAdded(e));
    this.drawingService.featureGeometryModified$
      .pipe(takeUntil(this.destroyed))
      .subscribe(geom => this.onFeatureGeometryModified(geom));
    this.drawingService.activeToolChanged$
      .pipe(takeUntil(this.destroyed))
      .subscribe(tool => this.onActiveToolChanged(tool));
    this.drawingService.featureSelected$
      .pipe(takeUntil(this.destroyed))
      .subscribe(feature => this.onFeatureSelected(feature));
  }

  public ngOnDestroy() {
    this.store$.dispatch(setSelectedFeature({ fid: null }));
    this.menubarService.deregisterComponent(BaseComponentTypeEnum.DRAWING);
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public draw(type: DrawingFeatureTypeEnum) {
    this.activeSpecificTool = type;
    if (this.activeTool !== type) {
      this.drawingService.toggle(type);
    }
  }

  public enableSelectAndModify() {
    this.activeSpecificTool = null;
    this.drawingService.enableSelectAndModify();
  }

  public onDrawingAdded($event: DrawingToolEvent) {
    if (!this.activeTool) {
      return;
    }
    const feature = DrawingHelper.getFeature(this.activeTool, $event);
    if (this.activeSpecificTool == CustomSizedDrawingToolEnum.CUSTOM_RECTANGLE && this.customRectangleWidth != null && this.customRectangleHeight != null && feature.geometry) {
      const rectangle = FeatureHelper.createRectangleAtPoint(feature.geometry, this.customRectangleWidth, this.customRectangleHeight);
      if (rectangle) {
        feature.geometry = rectangle;
      }
    }
    if (this.activeSpecificTool === CustomSizedDrawingToolEnum.CUSTOM_CIRCLE && this.customCircleRadius != null && feature.geometry) {
      const circle = FeatureHelper.createCircleAtPoint(feature.geometry, this.customCircleRadius);
      if (circle) {
        feature.geometry = circle;
      }
    }
    this.store$.dispatch(addFeature({
      feature,
      selectFeature: true,
    }));
  }

  public onActiveToolChanged($event: DrawingFeatureTypeEnum | null) {
    this.activeTool = $event;
    this.store$.dispatch(setSelectedDrawingStyle({ drawingType: $event }));
  }

  public onFeatureSelected(feature: FeatureModel | null) {
    this.store$.dispatch(setSelectedFeature({ fid: feature?.__fid || null }));
  }

  public onFeatureGeometryModified(geometry: string) {
    this.store$.dispatch(updateSelectedDrawingFeatureGeometry({ geometry }));
  }

  public removeSelectedFeature() {
    if (!this.selectedFeature) {
      return;
    }
    const removeId = this.selectedFeature.__fid;
    this.confirmService.confirm$(
      $localize `:@@core.drawing.delete-drawing-object-confirm:Delete drawing object`,
      $localize `:@@core.drawing.delete-drawing-object-confirm-message:Are you sure you want to delete this object?`,
      true,
    )
      .pipe(take(1), filter(answer => answer))
      .subscribe(() => {
        this.store$.dispatch(removeDrawingFeature({ fid: removeId }));
      });
  }

  public duplicateSelectedFeature() {
    this.mapService.getMapViewDetails$().pipe(take(1)).subscribe(mapViewDetails => {
      if (!this.selectedFeature || !this.selectedFeature.geometry) {
        return;
      }
      const feature = DrawingHelper.getDuplicateFeature(this.selectedFeature);
      feature.geometry = FeatureHelper.translateGeometryForDuplication(this.selectedFeature.geometry, mapViewDetails.resolution * 10, mapViewDetails.resolution * -10);
      this.store$.dispatch(addFeature({
        feature,
        selectFeature: true,
      }));
    });
  }

  public removeAllFeatures() {
    this.confirmService.confirm$(
      $localize `:@@core.drawing.delete-drawing-confirm:Delete complete drawing`,
      $localize `:@@core.drawing.delete-drawing-confirm-message:Are you sure you want to delete the complete drawing? All objects will be deleted and this cannot be undone.`,
      true,
    )
      .pipe(take(1), filter(answer => answer))
      .subscribe(() => {
        this.store$.dispatch(removeAllDrawingFeatures());
      });
  }

  public zoomToEntireDrawing() {
    this.store$.select(selectDrawingFeatures).pipe(take(1)).subscribe(features => {
      this.mapService.zoomToFeatures(features);
    });
  }

  public featureStyleUpdates(style: DrawingFeatureStyleModel) {
    if (this.selectedFeature) {
      this.store$.dispatch(updateDrawingFeatureStyle({ fid: this.selectedFeature.__fid, style }));
    }
    DrawingHelper.updateDefaultStyle({
      ...style,
      label: '',
    });
  }

  private _customRectangleWidth: number | null = null;
  public get customRectangleWidth(): number | null {
    return this._customRectangleWidth;
  }
  public set customRectangleWidth(value: number | null) {
    this._customRectangleWidth = value;
    this.drawCustomSizedRectangle();
  }

  private _customRectangleHeight: number | null = null;
  public get customRectangleHeight(): number | null {
    return this._customRectangleHeight;
  }
  public set customRectangleHeight(value: number | null) {
    this._customRectangleHeight = value;
    this.drawCustomSizedRectangle();
  }

  public drawCustomSizedRectangle() {
    if (this.customRectangleWidth !== null && this.customRectangleHeight !== null) {
      this.activeSpecificTool = CustomSizedDrawingToolEnum.CUSTOM_RECTANGLE;
      if (this.activeTool !== DrawingFeatureTypeEnum.POINT) {
        this.drawingService.toggle(DrawingFeatureTypeEnum.POINT);
      }
    } else {
      this.activeSpecificTool = DrawingFeatureTypeEnum.RECTANGLE;
      if (this.activeTool !== DrawingFeatureTypeEnum.RECTANGLE) {
        this.drawingService.toggle(DrawingFeatureTypeEnum.RECTANGLE);
      }
    }
  }

  public clearRectangleSize() {
    this.customRectangleWidth = null;
    this.customRectangleHeight = null;
  }

  private _customCircleRadius: number | null = null;
  public get customCircleRadius(): number | null {
    return this._customCircleRadius;
  }
  public set customCircleRadius(value: number | null) {
    this._customCircleRadius = value;
    if (this._customCircleRadius !== null) {
      this.activeSpecificTool = CustomSizedDrawingToolEnum.CUSTOM_CIRCLE;
      if (this.activeTool !== DrawingFeatureTypeEnum.POINT) {
        this.drawingService.toggle(DrawingFeatureTypeEnum.POINT);
      }
    } else {
      this.activeSpecificTool = DrawingFeatureTypeEnum.CIRCLE;
      if(this.activeTool !== DrawingFeatureTypeEnum.CIRCLE) {
        this.drawingService.toggle(DrawingFeatureTypeEnum.CIRCLE);
      }
    }
  }

  public clearCircleRadius() {
    this.customCircleRadius = null;
  }

  public drawCircle() {
    this.customCircleRadius = this._customCircleRadius;
  }
}
