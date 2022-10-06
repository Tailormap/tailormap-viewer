import { Component, OnInit, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { concatMap, Observable, of, startWith, Subject } from 'rxjs';
import { SearchResult, SearchResultModel, SimpleSearchService } from './simple-search.service';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import { MapService } from '@tailormap-viewer/map';

const EMPTY_SEARCH_RESULT = { results: [], attribution: '' };

@Component({
  selector: 'tm-simple-search',
  templateUrl: './simple-search.component.html',
  styleUrls: ['./simple-search.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleSearchComponent implements OnInit, OnDestroy {

  public active = false;
  public searchControl = new FormControl<string | SearchResult>('');
  public searchResults$: Observable<SearchResultModel> = of(EMPTY_SEARCH_RESULT);
  private destroyed = new Subject();
  private projectionCode = '';
  public focusCount = 0;

  private static readonly SEARCH_DEBOUNCE_TIME = 1000;

  private searchService = inject(SimpleSearchService);
  private mapService = inject(MapService);

  public ngOnInit(): void {
    this.mapService.getProjectionCode$()
      .pipe(takeUntil(this.destroyed))
      .subscribe(projectionCode => {
        this.projectionCode = projectionCode;
      });

    this.searchResults$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      filter((value): value is string => typeof value === 'string'),
      debounceTime(SimpleSearchComponent.SEARCH_DEBOUNCE_TIME),
      concatMap(searchStr => {
        if (!searchStr || searchStr.length <= 3) {
          return of(EMPTY_SEARCH_RESULT);
        }
        return this.searchService.search$(this.projectionCode, searchStr);
      }),
    );

    this.searchControl.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        filter((value): value is SearchResult => {
          return typeof value !== 'string' && !!value && !!(value as SearchResult).geometry;
        }),
      )
      .subscribe(searchResult => {
        this.mapService.zoomTo(searchResult.geometry, searchResult.projectionCode);
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public toggle(close?: boolean) {
    this.active = close ? false : !this.active;
    if (this.active) {
      this.focusCount++;
    }
  }

  public displayLabel(result: SearchResult): string {
    return result && result.label ? result.label : '';
  }

}
