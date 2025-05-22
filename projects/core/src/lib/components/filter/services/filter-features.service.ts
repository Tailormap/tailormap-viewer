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
                return geometries.map<FeatureModel>(geom => {
                  const feature = {
                    __fid: geom.id,
                    geometry: geom.geometry,
                    attributes: { buffer: undefined },
                  };
                  if(!buffer) {
                    return feature;
                  }
                  let bufferGeom: string;
                  if (geom.geometry.startsWith('CIRCLE(')) {
                    const g = geom.geometry.substring(7, geom.geometry.length - 1);
                    const [ x, y, radius ] = g.split(/\s+/);
                    const newRadius = parseFloat(radius) + (buffer || 0);
                    bufferGeom = `CIRCLE(${x} ${y} ${newRadius})`;
                  } else {
                    bufferGeom = bufferHelper(geom.geometry, buffer);
                  }
                  return {
                    ...feature,
                    attributes: { buffer: bufferGeom },
                  };
                });
              }),
            );
        }),
      );
  }

}
