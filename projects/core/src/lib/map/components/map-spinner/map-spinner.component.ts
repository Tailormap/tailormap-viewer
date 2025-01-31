import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { MapService } from '@tailormap-viewer/map';

@Component({
  selector: 'tm-map-spinner',
  templateUrl: './map-spinner.component.html',
  styleUrls: ['./map-spinner.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MapSpinnerComponent implements OnInit {

  @Input({ required: true })
  public loading$: Observable<boolean> | undefined;

  @Input({ required: true })
  public coordinates$: Observable<[number, number] | undefined> | undefined;

  public spinnerStyle$: Observable<{ display: string } | { top: string; left: string }> | undefined;

  constructor(
    private mapService: MapService,
  ) { }

  public ngOnInit(): void {
    if (!this.loading$ || !this.coordinates$) {
      return;
    }
    this.spinnerStyle$ = combineLatest([
      this.loading$,
      this.coordinates$
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
