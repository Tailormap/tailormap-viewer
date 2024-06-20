import { Component, ChangeDetectionStrategy, OnInit, DestroyRef, signal } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, pipe, switchMap, take } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { setDraftSearchIndexId } from '../state/search-index.actions';
import { selectDraftSearchIndex } from '../state/search-index.selectors';
import { FeatureTypeModel, SearchIndexModel } from '@tailormap-admin/admin-api';
import { FeatureSourceService } from '../../catalog/services/feature-source.service';
import { ExtendedFeatureTypeModel } from '../../catalog/models/extended-feature-type.model';
import { SearchIndexService } from '../services/search-index.service';
import { ConfirmDialogService } from '@tailormap-viewer/shared';

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

  private updatedSearch: Pick<SearchIndexModel, 'name' | 'featureTypeId' | 'comment'> | undefined;
  public saveEnabled = signal(false);

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private featureSourceService: FeatureSourceService,
    private searchIndexService: SearchIndexService,
    private destroyRef: DestroyRef,
    private router: Router,
    private confirmDelete: ConfirmDialogService,
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
    this.saveEnabled.set($event);
  }

  public updateSearchIndex($event: { searchIndex: Pick<SearchIndexModel, 'name' | 'featureTypeId' | 'comment'> }) {
    this.updatedSearch = $event.searchIndex;
  }

  public updateFeatureTypeSetting(updatedFeatureType: FeatureTypeModel) {
    this.setFeatureType(+updatedFeatureType.id);
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

  public save(searchIndex: SearchIndexModel) {
    if (!this.updatedSearch) {
      return;
    }
    this.savingSubject.next(true);
    this.searchIndexService.updateSearchIndex$(searchIndex.id, this.updatedSearch)
      .pipe(take(1))
      .subscribe(() => {
        this.savingSubject.next(false);
      });
  }

  public delete(searchIndex: SearchIndexModel) {
    this.confirmDelete.confirm$(
      $localize `:@@admin-core.search-index.delete-search-index:Delete search index ${searchIndex.name}`,
      $localize `:@@admin-core.search-index.delete-search-index-message:Are you sure you want to delete search index ${searchIndex.name}? This action cannot be undone.`,
      true,
    )
      .pipe(
        take(1),
        filter(answer => answer),
        switchMap(() => this.searchIndexService.deleteSearchIndex$(searchIndex.id)),
      )
      .subscribe(success => {
        if (success) {
          this.router.navigateByUrl('/admin/search-indexes');
        }
      });
  }

}
