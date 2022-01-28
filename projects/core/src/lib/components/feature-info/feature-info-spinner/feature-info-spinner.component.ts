import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, concatMap, map, Observable, of, switchMap } from 'rxjs';
import { selectLoadingFeatureInfo, selectMapCoordinates } from '../state/feature-info.selectors';
import { MapService } from '@tailormap-viewer/map';

@Component({
  selector: 'tm-feature-info-spinner',
  templateUrl: './feature-info-spinner.component.html',
  styleUrls: ['./feature-info-spinner.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureInfoSpinnerComponent implements OnInit {

  public spinnerStyle$: Observable<{ display: string } | { top: string; left: string }> | undefined;

  constructor(
    private store$: Store,
    private mapService: MapService,
  ) { }

  public ngOnInit(): void {
    this.spinnerStyle$ = combineLatest([
      this.store$.select(selectLoadingFeatureInfo),
      this.store$.select(selectMapCoordinates)
        .pipe(
          switchMap((coords) => {
            if (!coords) {
              return of(coords);
            }
            return this.mapService.getPixelForCoordinates$(coords);
          }),
        ),
    ]).pipe(
      map(([ loading, coords ]) => {
        if (!loading || !coords) {
          return { display: 'none' };
        }
        return { left: `${coords[0]}px`, top: `${coords[1]}px` };
      }),
    );
  }

}
