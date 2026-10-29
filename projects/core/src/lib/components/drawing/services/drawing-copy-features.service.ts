import { inject, Service } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, Observable } from 'rxjs';
import { DrawingToolEvent } from '@tailormap-viewer/map';
import { FeatureInfoService } from '../../feature-info/feature-info.service';
import { selectVisibleLayersWithAttributes } from '../../../map/state/map.selectors';
import { ExtendedAppLayerModel } from '../../../map/models';
import { DrawingFeatureModel, DrawingFeatureStyleModel } from '../../../map/models/drawing-feature.model';
import { DrawingHelper } from '../../../map/helpers/drawing.helper';

export interface CopiedDrawingFeaturesResult {
  features: DrawingFeatureModel[];
  error?: string;
  alreadyInDrawing?: boolean;
}

/**
 * Fetches features from a reference layer and converts them to drawing features, so they can be added to the drawing.
 */
@Service()
export class DrawingCopyFeaturesService {

  private store$ = inject(Store);
  private featureInfoService = inject(FeatureInfoService);

  /**
   * Visible layers with a feature source, so the geometry of their features is available.
   */
  public getReferenceLayers$(): Observable<ExtendedAppLayerModel[]> {
    return this.store$.select(selectVisibleLayersWithAttributes);
  }

  /**
   * Gets the first feature of the reference layer at the given coordinates and converts it to a drawing feature.
   * Multi-geometries are kept as a single drawing feature. A feature is skipped when the drawing already contains
   * a feature with exactly the same geometry.
   */
  public getDrawingFeaturesAt$(
    layerId: string,
    coordinates: [ number, number ],
    pointerType: string | undefined,
    style: DrawingFeatureStyleModel,
    existingFeatures: DrawingFeatureModel[],
  ): Observable<CopiedDrawingFeaturesResult> {
    return this.featureInfoService.getFeaturesForLayer$(coordinates, layerId, pointerType, false)
      .pipe(
        map((response): CopiedDrawingFeaturesResult => {
          if (!response) {
            return { features: [] };
          }
          if (response.error) {
            return { features: [], error: response.error };
          }
          // TODO: let the user choose a feature when there are multiple features at the clicked location
          const geometry = response.features.find(feature => !!feature.geometry)?.geometry;
          if (!geometry) {
            return { features: [] };
          }
          if (existingFeatures.some(feature => feature.geometry === geometry)) {
            return { features: [], alreadyInDrawing: true };
          }
          const type = DrawingHelper.getDrawingTypeForGeometry(geometry);
          if (!type) {
            console.warn(`Cannot copy feature from layer ${layerId} to the drawing, unsupported geometry type`, geometry);
            return { features: [] };
          }
          const drawingEvent: DrawingToolEvent = { type: 'end', geometry, centerCoordinate: [], lastCoordinate: [] };
          return { features: [DrawingHelper.getFeature(type, drawingEvent, style)] };
        }),
      );
  }

}
