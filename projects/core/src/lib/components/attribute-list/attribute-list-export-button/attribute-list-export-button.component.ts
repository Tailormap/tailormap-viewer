import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, concatMap, distinctUntilChanged, map, Observable, of, take } from 'rxjs';
import { AttributeListExportService, SupportedExportFormats } from '../services/attribute-list-export.service';
import { Store } from '@ngrx/store';
import {
  selectColumnsForSelectedTab, selectSelectedTab, selectSelectedTabLayerId, selectSortForSelectedTab,
} from '../state/attribute-list.selectors';
import { withLatestFrom } from 'rxjs/operators';
import { selectCQLFilters } from '../../../filter/state/filter.selectors';

@Component({
  selector: 'tm-attribute-list-export-button',
  templateUrl: './attribute-list-export-button.component.html',
  styleUrls: ['./attribute-list-export-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeListExportButtonComponent {

  public supportedFormats = SupportedExportFormats;

  private supportedFormatsSubject = new BehaviorSubject<SupportedExportFormats[]>([]);
  private supportedFormats$: Observable<SupportedExportFormats[]> = this.supportedFormatsSubject.asObservable();
  public showExportButton$ = this.supportedFormats$.pipe(map(formats => formats.length > 0));

  constructor(
    private store$: Store,
    private exportService: AttributeListExportService,
  ) {
    this.store$.select(selectSelectedTabLayerId)
      .pipe(
        distinctUntilChanged(),
        concatMap(layerId => {
          if (layerId === null) {
            return of([]);
          }
          return this.exportService.getExportFormats$(layerId);
        }),
      )
      .subscribe(formats => this.supportedFormatsSubject.next(formats));
  }

  public onExportClick(format: SupportedExportFormats) {
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
          return this.exportService.export$(tab.layerId, tab.label, format, filter, sort, attributes);
        }))
      .subscribe();
  }

  public isFormatSupported$(format: SupportedExportFormats) {
    return this.supportedFormats$.pipe(map(formats => formats.includes(format)));
  }

}
