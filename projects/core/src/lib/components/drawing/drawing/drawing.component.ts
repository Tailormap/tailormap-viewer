import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { MapService } from '@tailormap-viewer/map';
import { combineLatest, filter, Observable, of, Subject, take, takeUntil } from 'rxjs';
import {
  selectDrawingFeaturesIncludingSelected, selectSelectedDrawingStyle, selectSelectedDrawingFeature, selectHasDrawingFeatures,
} from '../state/drawing.selectors';
import { DrawingHelper } from '../helpers/drawing.helper';
import { MenubarService } from '../../menubar';
import { DrawingMenuButtonComponent } from '../drawing-menu-button/drawing-menu-button.component';
import { DrawingFeatureModel, DrawingFeatureModelAttributes, DrawingFeatureStyleModel } from '../models/drawing-feature.model';
import { DRAWING_ID } from '../drawing-identifier';
import { removeAllDrawingFeatures, removeDrawingFeature, updateDrawingFeatureStyle } from '../state/drawing.actions';
import { DrawingFeatureTypeEnum } from '../models/drawing-feature-type.enum';
import { ConfirmDialogService } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-drawing',
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    this.active$ = this.menubarService.isComponentVisible$(DRAWING_ID);
    this.hasFeatures$ = this.store$.select(selectHasDrawingFeatures);

    this.mapService.renderFeatures$<DrawingFeatureModelAttributes>(
      this.drawingLayerId,
      this.store$.select(selectDrawingFeaturesIncludingSelected),
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

    this.menubarService.registerComponent(DrawingMenuButtonComponent);
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public featureStyleUpdates(style: DrawingFeatureStyleModel) {
    if (this.selectedFeature) {
      this.store$.dispatch(updateDrawingFeatureStyle({ fid: this.selectedFeature.__fid, style }));
    }
    DrawingHelper.updateDefaultStyle(style);
  }

  public removeSelectedFeature() {
    if (!this.selectedFeature) {
      return;
    }
    const removeId = this.selectedFeature.__fid;
    this.confirmService.confirm$(
      $localize `Remove drawing object`,
      $localize `Are you sure you want to remove this object?`,
      true,
    )
      .pipe(take(1), filter(answer => answer))
      .subscribe(() => {
        this.store$.dispatch(removeDrawingFeature({ fid: removeId }));
      });
  }

  public removeAllFeatures() {
    this.confirmService.confirm$(
      $localize `Remove complete drawing`,
      $localize `Are you sure you want to remove the complete drawing? All objects will be removed and this cannot be undone.`,
      true,
    )
      .pipe(take(1), filter(answer => answer))
      .subscribe(() => {
        this.store$.dispatch(removeAllDrawingFeatures());
      });
  }

}
