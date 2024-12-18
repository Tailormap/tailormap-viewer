import { afterRender, ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { concatMap, Observable, of, startWith, Subject, tap, timer } from 'rxjs';
import { SimpleSearchService } from './simple-search.service';
import { debounceTime, filter, takeUntil, withLatestFrom, switchMap } from 'rxjs/operators';
import { MapService } from '@tailormap-viewer/map';
import { FeatureStylingHelper } from '../../../shared/helpers/feature-styling.helper';
import { FeatureHelper } from '@tailormap-viewer/map';
import { FeatureModel } from '@tailormap-viewer/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchResultModel, SearchResultItemModel } from './models';

type SearchStatusType = 'empty' | 'no_results' | 'searching' | 'belowMinLength' | 'complete';

@Component({
  selector: 'tm-simple-search',
  templateUrl: './simple-search.component.html',
  styleUrls: ['./simple-search.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleSearchComponent implements OnInit {

  private static readonly SEARCH_DEBOUNCE_TIME = 1000;

  public active = signal(false);
  public minLength = 4;

  public searchControl = new FormControl<string | SearchResultItemModel>('');

  private searchResultsSubject = new Subject<SearchResultModel[] | null>();
  public searchResults$: Observable<SearchResultModel[] | null> = this.searchResultsSubject.asObservable();

  private searchStatusSubject = new Subject<SearchStatusType>();
  public searchStatus$: Observable<SearchStatusType> = this.searchStatusSubject.asObservable();
  private isPanelOpen: boolean = false;

  constructor(
    private searchService: SimpleSearchService,
    private mapService: MapService,
    private destroyRef: DestroyRef,
  ) {
    afterRender(() => {
      // This is a bit of a hack, since we cannot define a header or something like that for an Autocomplete component
      // We manually move the search summary up to the panel itself, making the list scrollable, without the summary
      if (this.isPanelOpen) {
        this.moveSummeryUp();
      }
    });
  }

  public ngOnInit(): void {
    const searchTerm$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      filter(() => this.active()),
      filter((value): value is string => typeof value === 'string'));

    this.searchStatusSubject.next('empty');
    searchTerm$.pipe(
      takeUntilDestroyed(this.destroyRef),
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
      this.searchStatusSubject.next(searchResult.every(r => r.results.length === 0) ? 'no_results' : 'complete');
    });

    this.searchControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((value): value is SearchResultItemModel => {
          return typeof value !== 'string' && !!value && !!(value as SearchResultItemModel).geometry;
        }),
      )
      .subscribe(searchResult => this.showResult(searchResult));
  }

  public toggle(close?: boolean) {
    this.active.set(close ? false : !this.active());
  }

  public displayLabel(result: SearchResultItemModel): string {
    return result && result.label ? result.label : '';
  }

  private showResult(searchResult: SearchResultItemModel) {
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
        return this.mapService.renderFeatures$('search-result-highlight', of(feature), style, { zoomToFeature: true, updateWhileAnimating: true });
      }),
      takeUntil(timer(5000))).subscribe();
  }

  public scrollTo($event: MouseEvent, id: string) {
    $event.stopPropagation();
    $event.preventDefault();
    const targetGroup = `search-group-${id}`;
    const target = document.getElementById(targetGroup);
    document.querySelector<HTMLInputElement>('.search-field')?.blur();
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  public panelOpen(isOpen: boolean) {
    this.isPanelOpen = isOpen;
    if (!isOpen) {
      document.querySelector('.search-panel')?.parentElement?.classList.remove('simple-search-panel--with-summary');
    }
  }

  private moveSummeryUp() {
    const summary = document.querySelector('.result-summary');
    const panel = document.querySelector('.search-panel');
    if (!summary || !panel || summary.parentElement !== panel) {
      return;
    }
    panel.parentElement?.classList.add('simple-search-panel--with-summary');
    panel.parentElement?.insertBefore(summary, panel);
  }

}
