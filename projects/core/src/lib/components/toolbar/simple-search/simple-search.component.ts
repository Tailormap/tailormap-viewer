import { Component, OnInit, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { concatMap, Observable, of, startWith, Subject, tap, timer } from 'rxjs';
import { SearchResult, SearchResultModel, SimpleSearchService } from './simple-search.service';
import { debounceTime, filter, takeUntil, withLatestFrom } from 'rxjs/operators';
import { MapService } from '@tailormap-viewer/map';
import { FeatureStylingHelper } from '../../../shared/helpers/feature-styling.helper';

type SearchStatusType = 'empty'|'no_results'|'searching'|'belowMinLength'|'complete';

@Component({
  selector: 'tm-simple-search',
  templateUrl: './simple-search.component.html',
  styleUrls: ['./simple-search.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleSearchComponent implements OnInit, OnDestroy {

  public active = false;
  public minLength = 4;
  public searchControl = new FormControl<string | SearchResult>('');

  private searchResultsSubject = new Subject<SearchResultModel | null>();
  public searchResults$: Observable<SearchResultModel | null> = this.searchResultsSubject.asObservable();

  private searchStatusSubject = new Subject<SearchStatusType>();
  public searchStatus$: Observable<SearchStatusType> = this.searchStatusSubject.asObservable();

  private destroyed = new Subject();

  private static readonly SEARCH_DEBOUNCE_TIME = 1000;

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
    this.mapService.renderFeatures$('search-result-highlight', of({
      __fid: 'search-result-highlight-feature',
      geometry: searchResult.geometry,
      crs: searchResult.projectionCode,
      attributes: {},
    }), style, true, true).pipe(
      takeUntil(timer(5000)),
    ).subscribe();
  }

}
