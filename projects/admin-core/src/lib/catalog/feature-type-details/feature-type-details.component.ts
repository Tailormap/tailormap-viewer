import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { concatMap, distinctUntilChanged, map, Observable, of, switchMap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { FeatureTypeModel } from '@tailormap-admin/admin-api';
import { FeatureSourceService } from '../services/feature-source.service';
import { ExtendedCatalogModelHelper } from '../helpers/extended-catalog-model.helper';
import { Store } from '@ngrx/store';
import { selectFeatureSourceByFeatureTypeId } from '../state/catalog.selectors';

@Component({
  selector: 'tm-admin-feature-type-details',
  templateUrl: './feature-type-details.component.html',
  styleUrls: ['./feature-type-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureTypeDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private store$ = inject(Store);
  private featureSourceService = inject(FeatureSourceService);


  public featureType$: Observable<FeatureTypeModel | null> = of(null);

  public ngOnInit(): void {
    this.featureType$ = this.route.paramMap.pipe(
      map(params => params.get('featureTypeId')),
      distinctUntilChanged(),

      switchMap(featureTypeId => {
        if (typeof featureTypeId !== 'string') {
          return of(null);
        }
        return this.store$.select(selectFeatureSourceByFeatureTypeId(featureTypeId))
          .pipe(
            concatMap(featureSource => {
              if (!featureSource) {
                return of(null);
              }
              return this.featureSourceService.getDraftFeatureType$(
                ExtendedCatalogModelHelper.getFeatureTypeId(featureTypeId, featureSource.id),
                featureSource.id,
              );
            }),
          );
      }),
    );
  }

}
