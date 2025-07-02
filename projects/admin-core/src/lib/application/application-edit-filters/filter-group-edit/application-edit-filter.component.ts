import { Component, ChangeDetectionStrategy, DestroyRef, OnDestroy, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectSelectedFilterForSelectedGroup, selectSelectedFilterGroup } from '../../state/application.selectors';
import { AttributeFilterModel } from '@tailormap-viewer/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  setApplicationSelectedFilterGroupId, setApplicationSelectedFilterId, updateApplicationFilterConfigForSelectedGroup,
} from '../../state/application.actions';

@Component({
  selector: 'tm-admin-application-edit-filter',
  templateUrl: './application-edit-filter.component.html',
  styleUrls: ['./application-edit-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFilterComponent implements OnDestroy {

  public filterGroup = this.store$.selectSignal(selectSelectedFilterGroup);
  public selectedFilter = this.store$.selectSignal(selectSelectedFilterForSelectedGroup);

  public isCreatingFilter = signal(false);
  public showFilterForm = computed(() => {
    return this.isCreatingFilter() || !!this.selectedFilter();
  });

  public saveEnabled = signal(false);
  private updatedFilter: AttributeFilterModel | undefined;

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private destroyRef: DestroyRef,
  ) {
    this.route.params
      .pipe(
        map(params => params['filterGroupId']),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((filterGroupId) => {
        this.store$.dispatch(setApplicationSelectedFilterGroupId({ filterGroupId }));
      });
  }

  public updateFilter(filter: AttributeFilterModel) {
    this.updatedFilter = filter;
    if (!this.isCreatingFilter()) {
      this.store$.dispatch(updateApplicationFilterConfigForSelectedGroup({
        filter: this.updatedFilter,
      }));
    }
  }

  public ngOnDestroy(): void {
    this.store$.dispatch(setApplicationSelectedFilterGroupId({ filterGroupId: undefined }));
  }

  public createFilter() {
    this.store$.dispatch(setApplicationSelectedFilterId({ filterId: undefined }));
    this.isCreatingFilter.set(true);
    this.saveEnabled.set(false);
  }

  public validFormChanged(validForm: boolean) {
    this.saveEnabled.set(validForm);
  }

  public saveFilter() {
    if (!this.updatedFilter) {
      return;
    }
    this.store$.dispatch(updateApplicationFilterConfigForSelectedGroup({
      filter: this.updatedFilter,
    }));
    if (this.isCreatingFilter()) {
      this.store$.dispatch(setApplicationSelectedFilterId({ filterId: this.updatedFilter.id }));
      this.isCreatingFilter.set(false);
    }
  }

}
