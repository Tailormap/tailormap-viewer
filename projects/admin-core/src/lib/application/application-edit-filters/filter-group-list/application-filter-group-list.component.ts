import { Component, ChangeDetectionStrategy, Signal, OnInit, DestroyRef, signal, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFilterableFilterGroups, selectSelectedApplicationId } from '../../state/application.selectors';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ExtendedFilterGroupModel } from '../../models/extended-filter-group.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FilterHelper } from '@tailormap-viewer/shared';
import { deleteApplicationAttributeFilterGroup } from '../../state/application.actions';
import { ListFilterComponent } from '../../../shared/components/list-filter/list-filter.component';
import { MatCard } from '@angular/material/card';
import { MatRipple } from '@angular/material/core';
import { RouterLink } from '@angular/router';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'tm-admin-application-filter-group-list',
    templateUrl: './application-filter-group-list.component.html',
    styleUrls: ['./application-filter-group-list.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ListFilterComponent,
        ReactiveFormsModule,
        MatCard,
        MatRipple,
        RouterLink,
        MatIconButton,
        MatTooltip,
        MatIcon,
    ],
})
export class ApplicationFilterGroupListComponent implements OnInit {
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);


  public filterGroups: Signal<ExtendedFilterGroupModel[]> = this.store$.selectSignal(selectFilterableFilterGroups);
  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);

  public layerFilter = new FormControl('');
  public layerFilterSignal = signal<string>('');

  public filteredFilterGroups = computed(() => {
    const filterTerm = this.layerFilterSignal();
    const filterGroups = this.filterGroups();
    if (filterTerm) {
      return FilterHelper.filterByTerm(filterGroups, filterTerm, filterGroup => {
        const layerLabels = filterGroup.layers.map(layer => layer.label);
        return layerLabels.join(' ');
      });
    }
    return filterGroups;
  });

  public ngOnInit() {
    this.layerFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(filterTerm => {
        this.layerFilterSignal.set(filterTerm || '');
      });
  }

  public removeFilterGroup($event: MouseEvent, id: string) {
    $event.stopPropagation();
    this.store$.dispatch(deleteApplicationAttributeFilterGroup({ filterGroupId: id }));
  }

}
