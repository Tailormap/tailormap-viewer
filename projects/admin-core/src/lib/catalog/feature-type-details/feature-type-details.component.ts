import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { distinctUntilChanged, map, Observable, of, switchMap } from 'rxjs';
import { selectFeatureTypeById } from '../state/catalog.selectors';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';

@Component({
  selector: 'tm-admin-feature-type-details',
  templateUrl: './feature-type-details.component.html',
  styleUrls: ['./feature-type-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureTypeDetailsComponent implements OnInit {

  public featureType$: Observable<ExtendedFeatureTypeModel | null> = of(null);

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
  ) { }

  public ngOnInit(): void {
    this.featureType$ = this.route.paramMap.pipe(
      distinctUntilChanged((prev: ParamMap, curr: ParamMap) => {
        return prev.get('featureSourceId') === curr.get('featureSourceId') && prev.get('featureTypeId') === curr.get('featureTypeId');
      }),
      map(params => ({ featureSourceId: params.get('featureSourceId'), featureTypeId: params.get('featureTypeId') })),
      switchMap(({ featureSourceId, featureTypeId }) => {
        if (typeof featureSourceId !== 'string' || typeof featureTypeId !== 'string') {
          return of(null);
        }
        return this.store$.select(selectFeatureTypeById(featureTypeId));
      }),
    );
  }

}
