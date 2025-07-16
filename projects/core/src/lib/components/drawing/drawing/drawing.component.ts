import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { DrawingToolEvent, FeatureHelper, MapService, MapStyleModel } from '@tailormap-viewer/map';
import { combineLatest, filter, Observable, of, Subject, take, takeUntil, tap } from 'rxjs';
import {
  selectDrawingFeatures, selectDrawingFeaturesExcludingSelected, selectHasDrawingFeatures, selectSelectedDrawingFeature,
  selectSelectedDrawingType,
} from '../state/drawing.selectors';
import { DrawingHelper } from '../helpers/drawing.helper';
import { MenubarService } from '../../menubar';
import { DrawingMenuButtonComponent } from '../drawing-menu-button/drawing-menu-button.component';
import { DrawingFeatureModel, DrawingFeatureModelAttributes, DrawingFeatureStyleModel } from '../models/drawing-feature.model';
import {
  addFeature, removeAllDrawingFeatures, removeDrawingFeature, setSelectedDrawingType, setSelectedFeature, updateDrawingFeatureStyle,
  updateSelectedDrawingFeatureGeometry,
} from '../state/drawing.actions';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { BaseComponentTypeEnum, FeatureModel } from '@tailormap-viewer/api';
import { DrawingService } from '../../../map/services/drawing.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { DrawingStylesService } from '../services/drawing-styles.service';

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
  public selectedDrawingType: DrawingFeatureTypeEnum | null = null;
  public hasFeatures$: Observable<boolean> = of(false);

  public drawingTypes = DrawingFeatureTypeEnum;
  public activeTool: DrawingFeatureTypeEnum | null = null;
  public selectToolActive$ = this.drawingService.selectToolActive$;

  public selectionStyle = DrawingHelper.applyDrawingStyle as ((feature: FeatureModel) => MapStyleModel);
  public showMeasures = signal<boolean>(false);

  public mapUnits$ = this.mapService.getUnitsOfMeasure$();

  private static toolsWithMeasure = new Set([
    DrawingFeatureTypeEnum.CIRCLE,
    DrawingFeatureTypeEnum.SQUARE,
    DrawingFeatureTypeEnum.ELLIPSE,
    DrawingFeatureTypeEnum.POLYGON,
    DrawingFeatureTypeEnum.RECTANGLE,
    DrawingFeatureTypeEnum.LINE,
    DrawingFeatureTypeEnum.STAR,
  ]);

  constructor(
    private store$: Store,
    private mapService: MapService,
    private menubarService: MenubarService,
    private confirmService: ConfirmDialogService,
    private drawingService: DrawingService,
    private cdr: ChangeDetectorRef,
    private drawingStylesService: DrawingStylesService,
  ) { }

  public ngOnInit() {
    this.active$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.DRAWING).pipe(
      tap(visible => {
        if (!visible) {
          this.store$.dispatch(setSelectedFeature({ fid: null }));
          this.activeTool = null;
          this.drawingService.disableDrawingTools();
        } else {
          this.drawingService.createDrawingTools({
            drawingLayerId: this.drawingLayerId,
            selectionStyle: this.selectionStyle,
          });
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
      this.store$.select(selectSelectedDrawingType),
      this.store$.select(selectSelectedDrawingFeature),
    ])
      .pipe(takeUntil(this.destroyed))
      .subscribe(([ type, feature ]) => {
        console.log(`DrawingComponent: selected type: ${type}, selected feature type: ${feature?.attributes.type}`);
        this.selectedFeature = feature;
        this.selectedDrawingType = type;
        if (feature) {
          this.style = feature.attributes.style;
          this.selectedDrawingType = feature.attributes.type;
        }
        this.cdr.detectChanges();
      });

    this.menubarService.registerComponent({ type: BaseComponentTypeEnum.DRAWING, component: DrawingMenuButtonComponent });

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
    this.style = DrawingHelper.getDefaultStyle();
    this.drawingStylesService.setSelectedDrawingStyle(null);
    if (this.activeTool !== type) {
      this.drawingService.toggle(type, this.showMeasures());
    }
  }

  public showSizeCheckbox() {
    return this.activeTool !== null && DrawingComponent.toolsWithMeasure.has(this.activeTool);
  }

  public toggleMeasuring($event: MatCheckboxChange) {
    this.showMeasures.set($event.checked);
    if (this.activeTool) {
      this.drawingService.toggle(this.activeTool, $event.checked, true);
    }
  }

  public enableSelectAndModify() {
    this.drawingService.enableSelectAndModify();
    this.drawingStylesService.setSelectedDrawingStyle(null);
  }

  public onDrawingAdded($event: DrawingToolEvent) {
    if (!this.activeTool) {
      return;
    }
    const feature = DrawingHelper.getFeature(this.activeTool, $event, this.style);
    if (this.activeTool == DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE && this.customRectangleWidth != null && this.customRectangleHeight != null && feature.geometry) {
      const rectangle = FeatureHelper.createRectangleAtPoint(feature.geometry, this.customRectangleWidth, this.customRectangleHeight);
      if (rectangle) {
        feature.geometry = rectangle;
      }
    }
    if (this.activeTool === DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS && this.customCircleRadius != null && feature.geometry) {
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
    this.store$.dispatch(setSelectedDrawingType({ drawingType: $event }));
  }

  public onFeatureSelected(feature: FeatureModel | null) {
    this.store$.dispatch(setSelectedFeature({ fid: feature?.__fid || null }));
  }

  public featureSelected(fid: string) {
    this.store$.dispatch(setSelectedFeature({ fid }));
    this.drawingService.enableSelectAndModify(true);
    this.drawingStylesService.setSelectedDrawingStyle(null);
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
    DrawingHelper.updateDefaultStyle({
      ...style,
      label: '',
    });
    if (this.selectedFeature) {
      this.store$.dispatch(updateDrawingFeatureStyle({ fid: this.selectedFeature.__fid, style }));
    } else {
      this.style = DrawingHelper.getDefaultStyle();
    }
  }

  public selectDrawingStyle(style: DrawingFeatureModelAttributes) {
    this.style = {
      ...DrawingHelper.getDefaultStyle(),
      ...style.style,
      markerSize: style.type === DrawingFeatureTypeEnum.IMAGE ? 100 : undefined,
      label: '',
    };
    if (this.activeTool !== style.type) {
      this.drawingService.toggle(style.type, this.showMeasures());
    }
  }

  public SIZE_MIN = 10000;
  public SIZE_MAX = 1;

  private _customRectangleWidth: number | null = null;
  public get customRectangleWidth(): number | null {
    return this._customRectangleWidth;
  }
  public set customRectangleWidth(value: number | null) {
    this._customRectangleWidth = value;
    this.drawRectangle();
  }

  private _customRectangleHeight: number | null = null;
  public get customRectangleHeight(): number | null {
    return this._customRectangleHeight;
  }
  public set customRectangleHeight(value: number | null) {
    this._customRectangleHeight = value;
    this.drawRectangle();
  }

  public drawRectangle() {
    if (this.customRectangleWidth !== null && this.customRectangleWidth >= this.SIZE_MAX && this.customRectangleWidth <= this.SIZE_MIN
      && this.customRectangleHeight !== null && this.customRectangleHeight >= this.SIZE_MAX && this.customRectangleHeight <= this.SIZE_MIN) {
      if (this.activeTool !== DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE) {
        this.drawingService.toggle(DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE);
      }
    } else {
      if (this.activeTool !== DrawingFeatureTypeEnum.RECTANGLE) {
        this.drawingService.toggle(DrawingFeatureTypeEnum.RECTANGLE, this.showMeasures());
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
    if (this._customCircleRadius !== null && this._customCircleRadius >= this.SIZE_MAX && this._customCircleRadius <= this.SIZE_MIN) {
      if (this.activeTool !== DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS) {
        this.drawingService.toggle(DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS);
      }
    } else {
      if(this.activeTool !== DrawingFeatureTypeEnum.CIRCLE) {
        this.drawingService.toggle(DrawingFeatureTypeEnum.CIRCLE, this.showMeasures());
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
