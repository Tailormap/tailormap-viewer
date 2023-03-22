import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { concatMap, Observable, of, startWith, Subject, tap, timer } from 'rxjs';
import { SearchResult, SearchResultModel, SimpleSearchService } from './simple-search.service';
import { debounceTime, filter, takeUntil, withLatestFrom, switchMap } from 'rxjs/operators';
import { MapService } from '@tailormap-viewer/map';
import { FeatureStylingHelper } from '../../../shared/helpers/feature-styling.helper';
import { FeatureHelper } from '../../../../../../map/src/lib/helpers/feature.helper';
import { FeatureModel } from '@tailormap-viewer/api';

type SearchStatusType = 'empty' | 'no_results' | 'searching' | 'belowMinLength' | 'complete';

@Component({
  selector: 'tm-simple-search',
  templateUrl: './simple-search.component.html',
  styleUrls: ['./simple-search.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleSearchComponent implements OnInit, OnDestroy {

  private static readonly SEARCH_DEBOUNCE_TIME = 1000;
  public active = false;
  public minLength = 4;
  public searchControl = new FormControl<string | SearchResult>('');
  private searchResultsSubject = new Subject<SearchResultModel | null>();
  public searchResults$: Observable<SearchResultModel | null> = this.searchResultsSubject.asObservable();
  private searchStatusSubject = new Subject<SearchStatusType>();
  public searchStatus$: Observable<SearchStatusType> = this.searchStatusSubject.asObservable();
  private destroyed = new Subject();
  private searchService = inject(SimpleSearchService);
  private mapService = inject(MapService);

  public ngOnInit(): void {
    const searchTerm$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      filter(() => this.active),
      filter((value): value is string => typeof value === 'string'));

    this.searchStatusSubject.next('empty');
    searchTerm$.pipe(
      takeUntil(this.destroyed),
      tap(searchStr => {
        if (searchStr.length < this.minLength) {
          this.searchResultsSubject.next(null);
          this.searchStatusSubject.next(searchStr.length > 0 ? 'belowMinLength' : 'empty');
        }
      }),
      filter(searchStr => (searchStr || '').length >= this.minLength),
      tap(() => {
        this.searchStatusSubject.next('searching');
      }),
      debounceTime(SimpleSearchComponent.SEARCH_DEBOUNCE_TIME),
      withLatestFrom(this.mapService.getProjectionCode$()),
      concatMap(([ searchStr, projectionCode ]) => this.searchService.search$(projectionCode, searchStr)),
    ).subscribe(searchResult => {
      this.searchResultsSubject.next(searchResult);
      this.searchStatusSubject.next(searchResult.results.length === 0 ? 'no_results' : 'complete');
    });

    this.searchControl.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        filter((value): value is SearchResult => {
          return typeof value !== 'string' && !!value && !!(value as SearchResult).geometry;
        }),
      )
      .subscribe(searchResult => this.showResult(searchResult));
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public toggle(close?: boolean) {
    this.active = close ? false : !this.active;
  }

  public displayLabel(result: SearchResult): string {
    return result && result.label ? result.label : '';
  }

  private showResult(searchResult: SearchResult) {
    const style = FeatureStylingHelper.getDefaultHighlightStyle('search-result-highlight-style', {
      pointSize: 10,
      pointType: 'circle',
      pointStrokeWidth: 0,
    });
    const feature$: Observable<FeatureModel> = of({
      __fid: 'search-result-highlight-feature',
      geometry: searchResult.geometry,
      crs: searchResult.projectionCode,
      attributes: {},
    });

    feature$.pipe(
      withLatestFrom(this.mapService.getProjectionCode$()),
      switchMap(([ feature, projectionCode ]) => {
        if (feature.geometry && feature.crs && feature.crs !== projectionCode) {
          feature.geometry = FeatureHelper.transformGeometry(feature.geometry, feature.crs, projectionCode);
          feature.crs = projectionCode;
        }
        return this.mapService.renderFeatures$('search-result-highlight', of(feature), style, true, true);
      }),
      takeUntil(timer(5000))).subscribe();
  }

}
