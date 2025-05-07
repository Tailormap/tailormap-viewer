import { Component, ChangeDetectionStrategy, DestroyRef, Signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, Observable, switchMap, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectFilterableLayersForApplication, selectFilterGroups, selectSelectedApplicationId } from '../../state/application.selectors';
import { AttributeFilterModel, FilterGroupModel } from '@tailormap-viewer/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { AdminSnackbarService } from '../../../shared/services/admin-snackbar.service';
import {
  deleteApplicationFilterGroup, setApplicationSelectedFilterId, setApplicationSelectedFilterLayerId, updateApplicationFiltersConfig,
} from '../../state/application.actions';
import { tap } from 'rxjs/operators';
import { UpdateAttributeFilterModel } from '../../models/update-attribute-filter.model';
import { GeoServiceLayerInApplicationModel } from '../../models/geo-service-layer-in-application.model';
import { $localize } from '@angular/localize/init';

@Component({
  selector: 'tm-admin-application-edit-filter',
  templateUrl: './application-edit-filter.component.html',
  styleUrls: ['./application-edit-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFilterComponent implements OnDestroy {

  public updateAttributeFilter$: Observable<UpdateAttributeFilterModel | null>;

  public formValid: boolean = true;
  private filterGroup: FilterGroupModel<AttributeFilterModel> | null = null;

  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);
  public filterableLayers: Signal<GeoServiceLayerInApplicationModel[]> = this.store$.selectSignal(selectFilterableLayersForApplication);

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private destroyRef: DestroyRef,
    private confirmDelete: ConfirmDialogService,
    private adminSnackbarService: AdminSnackbarService,
    private router: Router,
  ) {
    this.updateAttributeFilter$ = this.route.params.pipe(
      takeUntilDestroyed(this.destroyRef),
      map(params => params['filterId']),
      switchMap(filterId => this.store$.select(selectFilterGroups).pipe(
        map(filterGroups => {
          for (const filterGroup of filterGroups) {
            const attributeFilter = filterGroup.filters.find(filterInGroup => filterInGroup.id === filterId);
            if (attributeFilter) {
              this.store$.dispatch(setApplicationSelectedFilterLayerId({ filterLayerId: filterGroup.layerIds[0] }));
              this.store$.dispatch(setApplicationSelectedFilterId({ filterId: filterId }));
              return {
                filterGroup: filterGroup,
                filterId: attributeFilter.id,
              };
            }
          }
          return null;
        }),
      )),
    );
  }

  public delete(attributeFilter: UpdateAttributeFilterModel) {
    this.confirmDelete.confirm$(
      $localize `:@@admin-core.applications.filters.delete-filter:Delete filter ${attributeFilter.filterId}`,
      $localize `:@@admin-core.applications.filters.delete-filter-message:Are you sure you want to delete form ${attributeFilter.filterId}? This action cannot be undone.`,
      true,
    )
      .pipe(
        take(1),
        filter(answer => answer),
        tap(() => this.store$.dispatch(deleteApplicationFilterGroup({ filterId: attributeFilter.filterId }))),
      )
      .subscribe(() => {
        this.adminSnackbarService.showMessage($localize `:@@admin-core.applications.filters.filter-removed:Filter ${attributeFilter.filterId} removed`);
        this.router.navigateByUrl('/admin/applications/application/' + this.applicationId() + '/filters');
      });
  }

  public updateFilter($event: FilterGroupModel<AttributeFilterModel>) {
    this.filterGroup = $event;
  }

  public validFormChanged($event: boolean) {
    this.formValid = $event;
  }

  public save() {
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
      console.log("filter groups: ", newFilterGroups);
    });

  }

  public ngOnDestroy(): void {
    this.store$.dispatch(setApplicationSelectedFilterId({ filterId: undefined }));
  }
}
