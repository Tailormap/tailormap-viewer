import { Component, ChangeDetectionStrategy, Signal, OnInit, DestroyRef, signal, computed } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFilterableFilterGroups, selectSelectedApplicationId } from '../../state/application.selectors';
import { FormControl } from '@angular/forms';
import { ExtendedFilterGroupModel } from '../../models/extended-filter-group.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FilterHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-admin-application-filter-group-list',
  templateUrl: './application-filter-group-list.component.html',
  styleUrls: ['./application-filter-group-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationFilterGroupListComponent implements OnInit {

  public filterGroups: Signal<ExtendedFilterGroupModel[]> = this.store$.selectSignal(selectFilterableFilterGroups);
  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);

  public layerFilter = new FormControl('');
  public layerFilterSignal = signal<string>('');

  public filteredFilterGroups = computed(() => {
    const filterTerm = this.layerFilterSignal();
    const filterGroups = this.filterGroups();
    if (filterTerm) {
      return FilterHelper.filterByTerm(filterGroups, filterTerm, filterGroup => {
        const layerNames = filterGroup.layers.map(layer => layer.name);
        return layerNames.join(' ');
      });
    }
    return filterGroups;
  });

  constructor(
    private store$: Store,
    private destroyRef: DestroyRef,
    ) { }

  public ngOnInit() {
    this.layerFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(filterTerm => {
        this.layerFilterSignal.set(filterTerm || '');
      });
  }

}
