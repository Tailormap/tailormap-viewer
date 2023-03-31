import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { selectFeatureTypeById } from '../state/catalog.selectors';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { FeatureSourceService } from '../services/feature-source.service';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { FeatureTypeUpdateModel } from '../models/feature-source-update.model';

@Component({
  selector: 'tm-admin-feature-type-details',
  templateUrl: './feature-type-details.component.html',
  styleUrls: ['./feature-type-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureTypeDetailsComponent implements OnInit, OnDestroy {

  public featureType$: Observable<ExtendedFeatureTypeModel | null> = of(null);
  private destroyed = new Subject();
  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  public updatedFeatureType: FeatureTypeUpdateModel | null = null;

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private featureSourceService: FeatureSourceService,
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
      tap(featureType => { if (featureType) { this.updatedFeatureType = null; }}),
    );
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateFeatureType($event: FeatureTypeUpdateModel) {
    this.updatedFeatureType = $event;
  }

  public save(featureSourceId: string, featureTypeId: string) {
    if (!this.updatedFeatureType) {
      return;
    }
    const updatedFeatureType = { ...this.updatedFeatureType };
    this.savingSubject.next(true);
    this.featureSourceService.updateFeatureType$(featureSourceId, featureTypeId, updatedFeatureType)
      .subscribe(() => {
        this.savingSubject.next(false);
      });
  }

}
