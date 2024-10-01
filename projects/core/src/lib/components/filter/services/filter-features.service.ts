import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, concatMap, map, Observable } from 'rxjs';
import { selectBuffer, selectGeometries } from '../state/filter-component.selectors';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { BufferHelper } from '@tailormap-viewer/map';

@Injectable({
  providedIn: 'root',
})
export class FilterFeaturesService {

  private bufferedFeatures$: Observable<FeatureModel<FeatureModelAttributes>[]> | undefined;

  constructor(
    private store$: Store,
  ) {}

  public getFilterFeatures$() {
    if (!this.bufferedFeatures$) {
      this.bufferedFeatures$ = this.getBufferedFeatures$();
    }
    return this.bufferedFeatures$;
  }

  private getBufferedFeatures$() {
    return BufferHelper.getBufferHelper$()
      .pipe(
        concatMap(bufferHelper => {
          return combineLatest([
            this.store$.select(selectGeometries),
            this.store$.select(selectBuffer),
          ])
            .pipe(
              map(([ geometries, buffer ]) => {
                return geometries.map<FeatureModel>(geom => ({
                  __fid: geom.id,
                  geometry: geom.geometry,
                  attributes: { buffer: buffer ? bufferHelper(geom.geometry, buffer) : undefined },
                }));
              }),
            );
        }),
      );
  }

}
