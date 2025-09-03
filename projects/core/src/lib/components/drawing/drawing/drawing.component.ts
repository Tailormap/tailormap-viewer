import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject, HostListener, ViewContainerRef, viewChild, effect,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { DrawingToolEvent, FeatureHelper, MapService, MapStyleModel } from '@tailormap-viewer/map';
import { combineLatest, filter, Observable, of, Subject, take, takeUntil, tap } from 'rxjs';
import {
  selectDrawingFeatures, selectDrawingFeaturesForMapRendering, selectHasDrawingFeatures, selectSelectedDrawingFeature,
  selectSelectedDrawingType,
} from '../state/drawing.selectors';
import { DrawingHelper } from '../../../map/helpers/drawing.helper';
import { MenubarService } from '../../menubar';
import { DrawingMenuButtonComponent } from '../drawing-menu-button/drawing-menu-button.component';
import {
  DrawingFeatureModel, DrawingFeatureModelAttributes, DrawingFeatureStyleModel, LabelDrawingFeatureStyleModel,
} from '../../../map/models/drawing-feature.model';
import {
  addFeature, removeAllDrawingFeatures, removeDrawingFeature, setSelectedDrawingType, setSelectedFeature, updateDrawingFeatureStyle,
  updateSelectedDrawingFeatureGeometry,
} from '../state/drawing.actions';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { BaseComponentTypeEnum, DrawingComponentConfigModel, FeatureModel } from '@tailormap-viewer/api';
import { DrawingService } from '../../../map/services/drawing.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { DrawingFeatureRegistrationService } from '../services/drawing-feature-registration.service';
import { selectComponentTitle } from '../../../state/core.selectors';
import { ComponentConfigHelper } from '../../../shared/helpers/component-config.helper';


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
  private store$ = inject(Store);
  private mapService = inject(MapService);
  private menubarService = inject(MenubarService);
  private confirmService = inject(ConfirmDialogService);
  private drawingService = inject(DrawingService);
  private drawingFeatureRegistrationService = inject(DrawingFeatureRegistrationService);
  private cdr = inject(ChangeDetectorRef);

  private belowDrawingButtonsContainer = viewChild('belowDrawingButtonsContainer', { read: ViewContainerRef });
  private aboveDrawingButtonsContainer = viewChild('aboveDrawingButtonsContainer', { read: ViewContainerRef });

  private destroyed = new Subject();
  public drawingLayerId = 'drawing-layer';
  public active$: Observable<boolean> = of(false);
  public selectedFeature: DrawingFeatureModel | null = null;
  public style = this.drawingService.style.asReadonly();
  public lockedStyle = this.drawingService.lockedStyle.asReadonly();
  public selectedDrawingType: DrawingFeatureTypeEnum | null = null;
  public hasFeatures$: Observable<boolean> = of(false);

  public drawingTypes = DrawingFeatureTypeEnum;
  public activeTool: DrawingFeatureTypeEnum | null = null;
  public selectToolActive$ = this.drawingService.selectToolActive$;

  public selectionStyle = DrawingHelper.applyDrawingStyle as ((feature: FeatureModel) => MapStyleModel);
  public showMeasures = this.drawingService.showMeasures.asReadonly();

  public mapUnits$ = this.mapService.getUnitsOfMeasure$();

  public SIZE_MAX = this.drawingService.SIZE_MAX;
  public SIZE_MIN = this.drawingService.SIZE_MIN;

  private static toolsWithMeasure = new Set([
    DrawingFeatureTypeEnum.CIRCLE,
    DrawingFeatureTypeEnum.SQUARE,
    DrawingFeatureTypeEnum.ELLIPSE,
    DrawingFeatureTypeEnum.POLYGON,
    DrawingFeatureTypeEnum.RECTANGLE,
    DrawingFeatureTypeEnum.LINE,
    DrawingFeatureTypeEnum.STAR,
  ]);

  constructor() {
    effect(() => {
      const components = this.drawingFeatureRegistrationService.registeredAdditionalDrawingFeatures();
      const belowButtonsContainer = this.belowDrawingButtonsContainer();
      const aboveButtonsContainer = this.aboveDrawingButtonsContainer();
      if (!belowButtonsContainer || !aboveButtonsContainer) {
        return;
      }
      belowButtonsContainer.clear();
      aboveButtonsContainer.clear();
      components.forEach(component => {
        if (component.position === 'aboveDrawingButtons') {
          aboveButtonsContainer.createComponent(component.component);
          return;
        }
        belowButtonsContainer.createComponent(component.component);
      });
    });
  }

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
      this.store$.select(selectDrawingFeaturesForMapRendering),
      DrawingHelper.applyDrawingStyle,
    ).pipe(takeUntil(this.destroyed)).subscribe();

    combineLatest([
      this.store$.select(selectSelectedDrawingType),
      this.store$.select(selectSelectedDrawingFeature),
    ])
      .pipe(takeUntil(this.destroyed))
      .subscribe(([ type, feature ]) => {
        this.selectedFeature = feature;
        this.selectedDrawingType = type;
        if (feature) {
          this.drawingService.style.set(feature.attributes.style);
          this.selectedDrawingType = feature.attributes.type;
          this.drawingService.lockedStyle.set(feature?.attributes.lockedStyle ?? false);
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
    this.drawingService.predefinedStyleSelected$
      .pipe(takeUntil(this.destroyed))
      .subscribe(() => this.store$.dispatch(setSelectedFeature({ fid: null })));

    this.openDrawingPanelIfConfigured();
  }

  public ngOnDestroy() {
    this.store$.dispatch(setSelectedFeature({ fid: null }));
    this.menubarService.deregisterComponent(BaseComponentTypeEnum.DRAWING);
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  @HostListener('window:keydown.delete', ['$event'])
  public onDeleteKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const isInput = target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    );
    if (!isInput && this.selectedFeature) {
      event.preventDefault();
      this.removeSelectedFeature();
    }
  }

  private resetBeforeDrawing() {
    const defaultNonUserEditableStyle: Partial<DrawingFeatureStyleModel> = {
      description: undefined,
      secondaryStroke: undefined,
      tertiaryStroke: undefined,
      dashOffset: 0,
      strokeOffset: 0,
    };
    DrawingHelper.updateDefaultStyle(defaultNonUserEditableStyle);
    this.drawingService.resetBeforeDrawing();
  }

  public draw(type: DrawingFeatureTypeEnum) {
    this.resetBeforeDrawing();
    if (this.activeTool !== type) {
      this.drawingService.toggle(type);
    }
  }

  public showSizeCheckbox() {
    return this.activeTool !== null && DrawingComponent.toolsWithMeasure.has(this.activeTool);
  }

  public toggleMeasuring($event: MatCheckboxChange) {
    this.drawingService.showMeasures.set($event.checked);
    if (this.activeTool) {
      this.drawingService.toggle(this.activeTool, true);
    }
  }

  public enableSelectAndModify() {
    this.drawingService.enableSelectAndModify();
  }

  public onDrawingAdded($event: DrawingToolEvent) {
    if (!this.activeTool) {
      return;
    }
    const attributes: Partial<DrawingFeatureModelAttributes> = {};
    if (this.drawingService.lockedStyle()) {
      attributes.lockedStyle = true;
    }
    const feature = DrawingHelper.getFeature(this.activeTool, $event, this.drawingService.style(), attributes);
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
      this.drawingService.style.set({ ...DrawingHelper.getUpdatedDefaultStyle(), label: style.label });
    }
  }

  public featureLabelStyleUpdates(labelStyle: LabelDrawingFeatureStyleModel) {
    DrawingHelper.updateDefaultStyle({
      ...labelStyle,
      label: '',
    });
    if (this.selectedFeature) {
      this.store$.dispatch(updateDrawingFeatureStyle({ fid: this.selectedFeature.__fid, style: { ...this.drawingService.style(), ...labelStyle } }));
    } else {
      this.drawingService.style.set({ ...DrawingHelper.getUpdatedDefaultStyle(), label: labelStyle.label });
    }
  }

  public get customRectangleWidth(): number | null {
    return this.drawingService.customRectangleWidth();
  }
  public set customRectangleWidth(value: number | null) {
    this.drawingService.customRectangleWidth.set(value);
    this.drawRectangle();
  }

  public get customRectangleLength(): number | null {
    return this.drawingService.customRectangleLength();
  }
  public set customRectangleLength(value: number | null) {
    this.drawingService.customRectangleLength.set(value);
    this.drawRectangle();
  }

  public drawRectangle() {
    this.resetBeforeDrawing();
    const customRectangleWidth = this.drawingService.customRectangleWidth();
    const customRectangleLength = this.drawingService.customRectangleLength();
    if (customRectangleWidth !== null && customRectangleWidth >= this.SIZE_MAX && customRectangleWidth <= this.SIZE_MIN
      && customRectangleLength !== null && customRectangleLength >= this.SIZE_MAX && customRectangleLength <= this.SIZE_MIN) {
      if (this.activeTool !== DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE) {
        this.drawingService.toggle(DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE);
      }
    } else {
      if (this.activeTool !== DrawingFeatureTypeEnum.RECTANGLE) {
        this.drawingService.toggle(DrawingFeatureTypeEnum.RECTANGLE);
      }
    }
  }

  public clearRectangleSize() {
    this.drawingService.customRectangleWidth.set(null);
    this.drawingService.customRectangleLength.set(null);
    this.drawRectangle();
  }

  public get customCircleRadius(): number | null {
    return this.drawingService.customCircleRadius();
  }
  public set customCircleRadius(value: number | null) {
    this.drawingService.customCircleRadius.set(value);
    this.drawCircle();
  }

  public drawCircle() {
    this.resetBeforeDrawing();
    const customCircleRadius = this.drawingService.customCircleRadius();
    if (customCircleRadius !== null && customCircleRadius >= this.SIZE_MAX && customCircleRadius <= this.SIZE_MIN) {
      if (this.activeTool !== DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS) {
        this.drawingService.toggle(DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS);
      }
    } else {
      if(this.activeTool !== DrawingFeatureTypeEnum.CIRCLE) {
        this.drawingService.toggle(DrawingFeatureTypeEnum.CIRCLE);
      }
    }
  }

  public clearCircleRadius() {
    this.drawingService.customCircleRadius.set(null);
    this.drawCircle();
  }

  public get customSquareLength(): number | null {
    return this.drawingService.customSquareLength();
  }
  public set customSquareLength(value: number | null) {
    this.drawingService.customSquareLength.set(value);
    this.drawSquare();
  }

  public drawSquare() {
    this.resetBeforeDrawing();
    const customSquareLength = this.drawingService.customSquareLength();
    if (customSquareLength !== null && customSquareLength >= this.SIZE_MAX && customSquareLength <= this.SIZE_MIN) {
      if (this.activeTool !== DrawingFeatureTypeEnum.SQUARE_SPECIFIED_LENGTH) {
        this.drawingService.toggle(DrawingFeatureTypeEnum.SQUARE_SPECIFIED_LENGTH);
      }
    } else {
      if(this.activeTool !== DrawingFeatureTypeEnum.SQUARE) {
        this.drawingService.toggle(DrawingFeatureTypeEnum.SQUARE);
      }
    }
  }

  public clearSquareLength() {
    this.drawingService.customSquareLength.set(null);
    this.drawSquare();
  }

  private openDrawingPanelIfConfigured() {
    ComponentConfigHelper.useInitialConfigForComponent<DrawingComponentConfigModel>(
      this.store$,
      BaseComponentTypeEnum.DRAWING,
      config => {
        if (config.openOnStartup) {
          this.store$.select(selectComponentTitle(BaseComponentTypeEnum.DRAWING, $localize `:@@core.drawing.drawing:Drawing`))
            .pipe(take(1))
            .subscribe(title => {
              this.menubarService.toggleActiveComponent(BaseComponentTypeEnum.DRAWING, title);
            });
        }
      },
    );
  }

}
