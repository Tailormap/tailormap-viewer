import { DestroyRef, Injectable, inject } from '@angular/core';
import {
  DrawingToolConfigModel,
  DrawingToolEvent,
  DrawingToolModel, FeatureHelper,
  MapClickToolConfigModel,
  MapClickToolModel,
  MapService,
  MapStyleModel,
  ModifyToolConfigModel,
  ModifyToolModel,
  ToolTypeEnum,
} from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import {
  selectEditStatus, selectEditError$, selectNewFeatureGeometryType, selectSelectedEditFeature, selectCopiedFeatures,
} from '../state/edit.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, concatMap, debounceTime, forkJoin, map, merge, Observable, of, switchMap, take, tap } from 'rxjs';
import { loadCopyFeatures, loadEditFeatures } from '../state/edit.actions';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { withLatestFrom } from 'rxjs/operators';
import { ApplicationStyleService } from '../../../services/application-style.service';
import { ApplicationLayerService } from '../../../map/services/application-layer.service';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

@Injectable({
  providedIn: 'root',
})
export class EditMapToolService {
  private mapService = inject(MapService);
  private store$ = inject(Store);
  private snackBar = inject(MatSnackBar);
  private applicationLayerService = inject(ApplicationLayerService);
  private destroyRef = inject(DestroyRef);

  private static DEFAULT_ERROR_MESSAGE = $localize `:@@core.edit.error-getting-features:Something went wrong while getting editable features, please try again`;
  private static DEFAULT_NO_FEATURES_FOUND_MESSAGE = $localize `:@@core.edit.no-features-found:No editable features found`;

  private editMapClickToolId = '';
  private editGeometryToolId = '';
  private createGeometryToolId = '';

  private createdGeometrySubject = new BehaviorSubject<string | null>(null);
  private editedGeometrySubject = new BehaviorSubject<string | null>(null);
  private readonly copiedGeometry$;

  public allEditGeometry$;

  constructor() {

    this.mapService.createTool$<MapClickToolModel, MapClickToolConfigModel>({ type: ToolTypeEnum.MapClick, owner: BaseComponentTypeEnum.EDIT })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(({ tool }) => {
          this.editMapClickToolId = tool.id;
        }),
        concatMap(({ tool }) => tool?.mapClick$ || of(null)),
      )
      .subscribe(mapClick => {
        this.handleMapClick(mapClick);
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
      owner: BaseComponentTypeEnum.EDIT,
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(({ tool }) => this.editGeometryToolId = tool.id),
        switchMap(({ tool }) => tool.featureModified$),
      )
      .subscribe(modifiedGeometry => {
        this.handleEditGeometryModified(modifiedGeometry);
      });

    this.copiedGeometry$ = this.store$.select(selectCopiedFeatures).pipe(
      map(copiedFeatures => {
        if (copiedFeatures.length === 0) {
          return null;
        }
        return copiedFeatures
          .map(feature => feature.geometry!)
          .reduce((previousValue, currentValue)  =>
            FeatureHelper.getWKT(FeatureHelper.appendMultiGeometryWKT(previousValue, currentValue)));
      }));

    this.allEditGeometry$ = merge(
      this.editedGeometrySubject.asObservable(),
      this.createdGeometrySubject.asObservable(),
      this.copiedGeometry$,
    );

    this.mapService.renderFeatures$("copied-features-geometry", this.copiedGeometry$, style)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.mapService.renderFeatures$("create-feature-geometry", this.createdGeometrySubject.asObservable(), style)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.mapService.createTool$<DrawingToolModel, DrawingToolConfigModel>({
      type: ToolTypeEnum.Draw,
      style,
      owner: BaseComponentTypeEnum.EDIT,
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(({ tool }) => this.createGeometryToolId = tool.id),
        switchMap(({ tool }) => tool.drawing$),
      )
      .subscribe(drawEvent => {
        this.handleCreateGeometryDrawEvent(drawEvent);
      });

    combineLatest([
      this.store$.select(selectEditStatus),
      this.store$.select(selectNewFeatureGeometryType),
      this.selectEditGeometry$(),
    ])
      .pipe(
        withLatestFrom(this.mapService.getToolManager$()),
        takeUntilDestroyed(this.destroyRef),
        debounceTime(0), // debounce to avoid multiple rapid enable/disable tool calls
      )
      .subscribe(([[ editStatus, newFeatureGeometryType, editGeometry ], toolManager ]) => {
        if (this.createdGeometrySubject.getValue() !== null) {
          this.createdGeometrySubject.next(null);
        }
        if (this.editedGeometrySubject.getValue() !== null) {
          this.editedGeometrySubject.next(null);
        }
        if(editStatus === 'inactive') {
          toolManager.disableTool(this.editMapClickToolId, true);
          toolManager.disableTool(this.editGeometryToolId, true);
          toolManager.disableTool(this.createGeometryToolId, false);
        } else if(editStatus === 'active' || editStatus === 'copy_features') {
          toolManager.disableTool(this.editGeometryToolId, true);
          toolManager.disableTool(this.createGeometryToolId, true);
          toolManager.enableTool(this.editMapClickToolId, true);
        } else if(editStatus === 'edit_feature') {
          toolManager.disableTool(this.createGeometryToolId, true);
          toolManager.enableTool(this.editMapClickToolId, true);
          toolManager.enableTool(this.editGeometryToolId, false, { geometry: editGeometry });
        } else if(editStatus === 'create_feature') {
          toolManager.disableTool(this.editMapClickToolId, true);
          toolManager.disableTool(this.editGeometryToolId, true);
          toolManager.enableTool(this.createGeometryToolId, true, { type: newFeatureGeometryType });
        }
      });
  }

  private selectEditGeometry$(): Observable<string> {
    return this.store$.select(selectSelectedEditFeature)
      .pipe(
        switchMap(selectedFeature => {
          if (!selectedFeature) {
            return of([ null, null ]);
          }
          return forkJoin([
            of(selectedFeature),
            this.applicationLayerService.getLayerDetails$(selectedFeature.feature.layerId).pipe(take(1)),
          ]);
        }),
        map(([ selectedFeature, layerDetails ]) => {
          if (selectedFeature && layerDetails) {
            return selectedFeature.feature.attributes[layerDetails.details.geometryAttribute];
          } else {
            return '';
          }
        }));
  }

  private handleMapClick(evt: { mapCoordinates: [number, number]; mouseCoordinates: [number, number]; pointerType?: string }) {
    this.store$.select(selectEditStatus).pipe(take(1))
    .subscribe(status => {
      if (status === 'active') {
        this.store$.dispatch(loadEditFeatures({ coordinates: evt.mapCoordinates, mouseCoordinates: evt.mouseCoordinates, pointerType: evt.pointerType }));
      } else if (status === 'copy_features') {
        this.store$.dispatch(loadCopyFeatures({ coordinates: evt.mapCoordinates, mouseCoordinates: evt.mouseCoordinates, pointerType: evt.pointerType }));
      }
    });
    this.store$.pipe(selectEditError$)
      .subscribe(error => {
        if (!error || error.error === 'none') {
          return;
        }
        const config: SnackBarMessageOptionsModel = {
          message: error.error === 'error'
            ? error.errorMessage || EditMapToolService.DEFAULT_ERROR_MESSAGE
            : EditMapToolService.DEFAULT_NO_FEATURES_FOUND_MESSAGE,
          duration: 5000,
          showDuration: true,
          showCloseButton: true,
        };
        SnackBarMessageComponent.open$(this.snackBar, config);
      });
  }

  private handleCreateGeometryDrawEvent(drawEvent: DrawingToolEvent | null) {
    if (drawEvent && drawEvent.type === 'end') {
      this.createdGeometrySubject.next(drawEvent.geometry);
    }
    if (drawEvent && drawEvent.type === 'start') {
      this.createdGeometrySubject.next('');
    }
  }

  private handleEditGeometryModified(modifiedGeometry: string) {
    this.editedGeometrySubject.next(modifiedGeometry);
  }
}
