import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { FeatureHelper, MapService } from '@tailormap-viewer/map';
import { combineLatest, filter, Observable, of, Subject, take, takeUntil } from 'rxjs';
import {
  selectDrawingFeaturesExcludingSelected, selectSelectedDrawingStyle, selectSelectedDrawingFeature, selectHasDrawingFeatures,
  selectDrawingFeatures,
} from '../state/drawing.selectors';
import { DrawingHelper } from '../helpers/drawing.helper';
import { MenubarService } from '../../menubar';
import { DrawingMenuButtonComponent } from '../drawing-menu-button/drawing-menu-button.component';
import { DrawingFeatureModel, DrawingFeatureModelAttributes, DrawingFeatureStyleModel } from '../models/drawing-feature.model';
import { addFeature, removeAllDrawingFeatures, removeDrawingFeature, updateDrawingFeatureStyle } from '../state/drawing.actions';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-drawing',
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DrawingComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public drawingLayerId = 'drawing-layer';
  public active$: Observable<boolean> = of(false);
  public selectedFeature: DrawingFeatureModel | null = null;
  public style: DrawingFeatureStyleModel = DrawingHelper.getDefaultStyle();
  public selectedDrawingStyle: DrawingFeatureTypeEnum | null = null;
  public hasFeatures$: Observable<boolean> = of(false);

  constructor(
    private store$: Store,
    private mapService: MapService,
    private menubarService: MenubarService,
    private confirmService: ConfirmDialogService,
    private cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit() {
    this.active$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.DRAWING);
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
  }

  public ngOnDestroy() {
    this.menubarService.deregisterComponent(BaseComponentTypeEnum.DRAWING);
    this.destroyed.next(null);
    this.destroyed.complete();
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
}
