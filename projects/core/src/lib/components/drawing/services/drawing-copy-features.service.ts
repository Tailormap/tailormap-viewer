import { inject, Service } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, Observable } from 'rxjs';
import { DrawingToolEvent } from '@tailormap-viewer/map';
import { FeatureInfoService } from '../../feature-info/feature-info.service';
import { selectVisibleLayersWithAttributes } from '../../../map/state/map.selectors';
import { ExtendedAppLayerModel } from '../../../map/models';
import { DrawingFeatureModel, DrawingFeatureModelAttributes, DrawingFeatureStyleModel } from '../../../map/models/drawing-feature.model';
import { DrawingHelper } from '../../../map/helpers/drawing.helper';

export interface CopiedDrawingFeaturesResult {
  features: DrawingFeatureModel[];
  error?: string;
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
   * Gets the first feature of the reference layer at the given coordinates that is not in the drawing yet, and converts it
   * to a drawing feature. A feature is in the drawing when the drawing contains a feature with exactly the same geometry.
   * Clicking repeatedly on overlapping features therefore copies them one by one. When all features at the location are
   * already in the drawing, the first one is copied again. Multi-geometries are kept as a single drawing feature.
   */
  public getDrawingFeaturesAt$(
    layerId: string,
    coordinates: [ number, number ],
    pointerType: string | undefined,
    style: DrawingFeatureStyleModel,
    existingFeatures: DrawingFeatureModel[],
    attributes?: Partial<DrawingFeatureModelAttributes>,
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
          const geometries = response.features
            .map(feature => feature.geometry)
            .filter((geometry): geometry is string => !!geometry);
          if (geometries.length === 0) {
            return { features: [] };
          }
          const existingGeometries = new Set(existingFeatures.map(feature => feature.geometry));
          const geometry = geometries.find(g => !existingGeometries.has(g)) ?? geometries[0];
          const type = DrawingHelper.getDrawingTypeForGeometry(geometry);
          if (!type) {
            console.warn(`Cannot copy feature from layer ${layerId} to the drawing, unsupported geometry type`, geometry);
            return { features: [] };
          }
          const drawingEvent: DrawingToolEvent = { type: 'end', geometry, centerCoordinate: [], lastCoordinate: [] };
          return { features: [DrawingHelper.getFeature(type, drawingEvent, style, attributes)] };
        }),
      );
  }

}
