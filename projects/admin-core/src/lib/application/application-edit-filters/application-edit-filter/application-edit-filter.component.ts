import { Component, ChangeDetectionStrategy, DestroyRef, Signal, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, filter, map, Observable, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectFilterableLayersForApplication, selectFilterGroups, selectSelectedApplicationId } from '../../state/application.selectors';
import { AttributeFilterModel, FilterGroupModel } from '@tailormap-viewer/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AttributeFilterHelper, ConfirmDialogService } from '@tailormap-viewer/shared';
import { AdminSnackbarService } from '../../../shared/services/admin-snackbar.service';
import {
  deleteApplicationAttributeFilter, setApplicationSelectedFilterId, setApplicationSelectedFilterLayerId, updateApplicationFiltersConfig,
} from '../../state/application.actions';
import { UpdateAttributeFilterModel } from '../../models/update-attribute-filter.model';

@Component({
  selector: 'tm-admin-application-edit-filter',
  templateUrl: './application-edit-filter.component.html',
  styleUrls: ['./application-edit-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFilterComponent implements OnDestroy {

  public updateAttributeFilter$: Observable<UpdateAttributeFilterModel | null>;

  private filterGroup: FilterGroupModel<AttributeFilterModel> | null = null;

  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);
  public saveEnabled = signal(false);

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private destroyRef: DestroyRef,
    private confirmDelete: ConfirmDialogService,
    private adminSnackbarService: AdminSnackbarService,
    private router: Router,
  ) {
    this.updateAttributeFilter$ = combineLatest([
      this.route.params.pipe(
        map(params => params['filterId']),
      ),
      this.store$.select(selectFilterGroups),
      this.store$.select(selectFilterableLayersForApplication),
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(([ filterId, filterGroups, filterableLayers ]) => {
          const filterGroup = filterGroups.find(group =>
            group.filters.some(attributeFilter => attributeFilter.id === filterId),
          );
          if (!filterGroup) {
            return null;
          }
          const attributeFilter = filterGroup.filters.find(filterInGroup => filterInGroup.id === filterId);
          return {
            filterGroup,
            filterId: attributeFilter?.id ?? '',
            filterableLayers,
          };
        }),
      );

    this.updateAttributeFilter$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updateAttributeFilter => {
        this.store$.dispatch(setApplicationSelectedFilterLayerId({ filterLayerId: updateAttributeFilter?.filterGroup.layerIds[0] }));
        this.store$.dispatch(setApplicationSelectedFilterId({ filterId: updateAttributeFilter?.filterId }));
      });
  }

  public delete(attributeFilter: UpdateAttributeFilterModel) {
    this.confirmDelete.confirm$(
      $localize `:@@admin-core.applications.filters.delete-filter:Delete filter ${this.getAttributeFilterLabel(attributeFilter)}`,
      $localize `:@@admin-core.applications.filters.delete-filter-message:
        Are you sure you want to delete filter ${this.getAttributeFilterLabel(attributeFilter)}? This action cannot be undone.`,
      true,
    )
      .pipe(
        take(1),
        filter(answer => answer),
      )
      .subscribe(() => {
        this.store$.dispatch(deleteApplicationAttributeFilter({ filterId: attributeFilter.filterId }));
        this.adminSnackbarService.showMessage($localize `:@@admin-core.applications.filters.filter-removed:Filter ${this.getAttributeFilterLabel(attributeFilter)} removed`);
        this.router.navigateByUrl('/admin/applications/application/' + this.applicationId() + '/filters');
      });
  }

  public updateFilter($event: FilterGroupModel<AttributeFilterModel>) {
    this.filterGroup = $event;
  }

  public validFormChanged($event: boolean) {
    this.saveEnabled.set($event);
  }

  public save(attributeFilter: UpdateAttributeFilterModel) {
    this.store$.select(selectFilterGroups).pipe(
      take(1),
    ).subscribe(filterGroups => {
      if (!this.filterGroup) {
        return;
      }
      const newFilterGroups: FilterGroupModel<AttributeFilterModel>[] = [];
      for (const filterGroup of filterGroups) {
        if (filterGroup.id !== this.filterGroup?.id) {
          newFilterGroups.push(filterGroup);
        }
      }
      newFilterGroups.push(this.filterGroup);
      this.store$.dispatch(updateApplicationFiltersConfig({ filterGroups: newFilterGroups }));
      this.adminSnackbarService.showMessage($localize `:@@admin-core.applications.filters.filter-updated:Filter ${this.getAttributeFilterLabel(attributeFilter)} updated`);
    });

  }

  public ngOnDestroy(): void {
    this.store$.dispatch(setApplicationSelectedFilterId({ filterId: undefined }));
  }

  private getAttributeFilterLabel(updateAttributeFilter: UpdateAttributeFilterModel): string {
    const attributeFilter = updateAttributeFilter.filterGroup.filters.find(filterInGroup =>
      filterInGroup.id === updateAttributeFilter.filterId);
    if (!attributeFilter) {
      return updateAttributeFilter.filterId;
    }
    return attributeFilter.attribute + " " + AttributeFilterHelper.getConditionTypes(true).find(conditionType =>
      conditionType.condition === attributeFilter.condition)?.label;
  }
}
