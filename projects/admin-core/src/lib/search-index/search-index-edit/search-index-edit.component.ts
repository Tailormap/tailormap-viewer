import { Component, ChangeDetectionStrategy, OnInit, DestroyRef, signal } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, switchMap, take } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { setDraftSearchIndexId, updateDraftSearchIndex } from '../state/search-index.actions';
import { selectDraftSearchIndex } from '../state/search-index.selectors';
import { AttributeDescriptorModel, FeatureTypeModel, SearchIndexModel } from '@tailormap-admin/admin-api';
import { FeatureSourceService } from '../../catalog/services/feature-source.service';
import { SearchIndexService } from '../services/search-index.service';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { ExtendedFeatureTypeModel } from '../../catalog/models/extended-feature-type.model';

@Component({
  selector: 'tm-admin-search-index-edit',
  templateUrl: './search-index-edit.component.html',
  styleUrls: ['./search-index-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchIndexEditComponent implements OnInit {

  public searchIndex$: Observable<SearchIndexModel | undefined> = of(undefined);

  public loadingFeatureType = signal(false);

  private featureTypeSubject$ = new BehaviorSubject<FeatureTypeModel | null>(null);
  public featureType$ = this.featureTypeSubject$.asObservable();

  private extendedFeatureTypeSubject$ = new BehaviorSubject<ExtendedFeatureTypeModel | null>(null);
  public extendedFeatureType$ = this.extendedFeatureTypeSubject$.asObservable();

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

  public updateSearchIndex(id: number, $event: { searchIndex: Pick<SearchIndexModel, 'name' | 'featureTypeId' | 'comment'> }) {
    this.store$.dispatch(updateDraftSearchIndex({ id, searchIndex: $event.searchIndex }));
  }

  public updateFeatureTypeSetting(updatedFeatureType: FeatureTypeModel) {
    this.setFeatureType(+updatedFeatureType.id);
  }

  public save() {
    this.savingSubject.next(true);
    this.searchIndexService.saveDraftSearchIndex$()
      .pipe(take(1))
      .subscribe(() => this.savingSubject.next(false));
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

  public toggleAttribute(
    attribute: AttributeDescriptorModel,
    searchIndex: SearchIndexModel,
    field: keyof Pick<SearchIndexModel, 'searchFieldsUsed' | 'searchDisplayFieldsUsed'>,
  ) {
    const currentSelection = searchIndex[field];
    const idx = currentSelection.findIndex(a => a === attribute.name);
    const updatedSelection = idx === -1
      ? [ ...currentSelection, attribute.name ]
      : [ ...currentSelection.slice(0, idx), ...currentSelection.slice(idx + 1) ];
    this.store$.dispatch(updateDraftSearchIndex({ id: searchIndex.id, searchIndex: { [field]: updatedSelection } }));
    this.saveEnabled.set(true);
  }

  private setFeatureType(featureTypeId: number | undefined) {
    if (typeof featureTypeId === 'undefined') {
      this.featureTypeSubject$.next(null);
      return;
    }
    this.loadFeatureType(featureTypeId);
    this.loadExtendedFeatureType(featureTypeId);
  }

  private loadFeatureType(featureTypeId: number) {
    this.loadingFeatureType.set(true);
    this.featureSourceService.loadFeatureTypeById$(`${featureTypeId}`)
      .pipe(take(1))
      .subscribe(featureType => {
        this.featureTypeSubject$.next(featureType);
        this.loadingFeatureType.set(false);
      });
  }

  private loadExtendedFeatureType(featureTypeId: number) {
    this.featureSourceService.getFeatureTypes$()
      .pipe(take(1))
      .subscribe(featureTypes => {
        this.extendedFeatureTypeSubject$.next(featureTypes.find(f => +f.originalId === featureTypeId) || null);
      });
  }

}
