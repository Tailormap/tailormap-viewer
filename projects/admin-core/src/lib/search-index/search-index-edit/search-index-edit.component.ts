import { Component, ChangeDetectionStrategy, OnInit, DestroyRef } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, take, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { setDraftSearchIndexId } from '../state/search-index.actions';
import { selectDraftSearchIndex } from '../state/search-index.selectors';
import { SearchIndexModel } from '@tailormap-admin/admin-api';
import { FeatureSourceService } from '../../catalog/services/feature-source.service';
import { FeatureTypeUpdateService } from '../../catalog/services/feature-type-update.service';
import { ExtendedFeatureTypeModel } from '../../catalog/models/extended-feature-type.model';

@Component({
  selector: 'tm-admin-search-index-edit',
  templateUrl: './search-index-edit.component.html',
  styleUrls: ['./search-index-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchIndexEditComponent implements OnInit {

  public searchIndex$: Observable<SearchIndexModel | undefined> = of(undefined);

  private featureTypeSubject$ = new BehaviorSubject<ExtendedFeatureTypeModel | null>(null);
  public featureType$ = this.featureTypeSubject$.asObservable();

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private featureSourceService: FeatureSourceService,
    private featureTypeUpdateService: FeatureTypeUpdateService,
    private destroyRef: DestroyRef,
  ) {
  }

  public ngOnInit() {
    this.route.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef),
      map(params => params.get('searchIndexId')),
      distinctUntilChanged(),
      filter((searchIndexId): searchIndexId is string => !!searchIndexId),
    ).subscribe(searchIndex => {
      this.store$.dispatch(setDraftSearchIndexId({ id: +searchIndex }));
    });
    this.searchIndex$ = this.store$.select(selectDraftSearchIndex);
    this.searchIndex$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged((f1, f2) => f1?.featureTypeId === f2?.featureTypeId),
      )
      .subscribe(form => this.setFeatureType(form?.featureTypeId));
  }

  public validFormChanged($event: boolean) {
    console.log($event);
  }

  public updateSearchIndex($event: { searchIndex: Pick<SearchIndexModel, 'name' | 'featureTypeId' | 'comment'> }) {
    console.log($event);
  }

  public updateFeatureTypeSetting($event: MouseEvent, featureType: ExtendedFeatureTypeModel) {
    $event.preventDefault();
    if (!featureType) {
      return;
    }
    this.featureTypeUpdateService.updateFeatureTypeSetting$(featureType.originalId, +featureType.featureSourceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updatedFeatureType => {
        if (updatedFeatureType) {
          this.setFeatureType(+updatedFeatureType.id);
        }
      });
  }

  private setFeatureType(featureTypeId: number | undefined) {
    if (typeof featureTypeId === 'undefined') {
      this.featureTypeSubject$.next(null);
      return;
    }
    this.featureSourceService.getFeatureTypes$()
      .pipe(take(1))
      .subscribe(featureTypes => {
        this.featureTypeSubject$.next(featureTypes.find(f => +f.originalId === featureTypeId) || null);
      });
  }
}
