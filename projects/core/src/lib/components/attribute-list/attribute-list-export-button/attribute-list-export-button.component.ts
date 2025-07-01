import { Component, ChangeDetectionStrategy, OnDestroy, inject } from '@angular/core';
import {
  BehaviorSubject, concatMap, distinctUntilChanged, map, Observable, of, Subject, take, withLatestFrom, takeUntil, combineLatest,
} from 'rxjs';
import { AttributeListExportService, SupportedExportFormats } from '../services/attribute-list-export.service';
import { Store } from '@ngrx/store';
import {
  selectColumnsForSelectedTab, selectSelectedTab, selectSelectedTabLayerId, selectSortForSelectedTab,
} from '../state/attribute-list.selectors';
import { selectCQLFilters } from '../../../filter/state/filter.selectors';
import { selectLayers } from '../../../map/state/map.selectors';
import { HiddenLayerFunctionality } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-attribute-list-export-button',
  templateUrl: './attribute-list-export-button.component.html',
  styleUrls: ['./attribute-list-export-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AttributeListExportButtonComponent implements OnDestroy {
  private store$ = inject(Store);
  private exportService = inject(AttributeListExportService);


  private destroyed = new Subject();

  public supportedFormats = SupportedExportFormats;

  private supportedFormatsSubject = new BehaviorSubject<SupportedExportFormats[]>([]);
  private supportedFormats$: Observable<SupportedExportFormats[]> = this.supportedFormatsSubject.asObservable();
  public showExportButton$ = this.supportedFormats$.pipe(map(formats => formats.length > 0));

  private isExportingSubject = new BehaviorSubject(false);
  public isExporting$ = this.isExportingSubject.asObservable();

  constructor() {
    combineLatest([
      this.store$.select(selectLayers),
      this.store$.select(selectSelectedTabLayerId),
    ])
      .pipe(
        takeUntil(this.destroyed),
        distinctUntilChanged(),
        concatMap(([ layers, layerId ]) => {
          if (layerId === null) {
            return of([]);
          }
          const layer = layers.find(l => l.id === layerId);
          if (layer?.hiddenFunctionality?.includes(HiddenLayerFunctionality.export)) {
            return of([]);
          }
          return this.exportService.getExportFormats$(layerId);
        }),
      )
      .subscribe(formats => this.supportedFormatsSubject.next(formats));
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public onExportClick(format: SupportedExportFormats) {
    this.isExportingSubject.next(true);
    this.store$.select(selectSelectedTab)
      .pipe(
        withLatestFrom(
          this.store$.select(selectCQLFilters),
          this.store$.select(selectSortForSelectedTab),
          this.store$.select(selectColumnsForSelectedTab),
        ),
        take(1),
        concatMap(([ tab, filters, sort, columns ]) => {
          if (tab === null || typeof tab.layerId === 'undefined') {
            return of(false);
          }
          const filter = filters.get(tab.layerId);
          const attributes = columns.filter(c => c.visible).map(c => c.id);
          return this.exportService.export$({ layerId: tab.layerId, serviceLayerName: tab.label, format, filter, sort, attributes });
        }))
      .subscribe(() => {
        this.isExportingSubject.next(false);
      });
  }

  public isFormatSupported$(format: SupportedExportFormats) {
    return this.supportedFormats$.pipe(map(formats => formats.includes(format)));
  }

}
