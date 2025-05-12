import { Component, ChangeDetectionStrategy, DestroyRef, Signal, OnDestroy, signal } from '@angular/core';
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
  public saving = signal(false);

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
          const filterGroup = filterGroups.find(group =>
            group.filters.some(attributeFilter => attributeFilter.id === filterId)
          );
          if (!filterGroup) {
            return null;
          }
          const attributeFilter = filterGroup.filters.find(attributeFilter => attributeFilter.id === filterId);
          this.store$.dispatch(setApplicationSelectedFilterLayerId({ filterLayerId: filterGroup.layerIds[0] }));
          this.store$.dispatch(setApplicationSelectedFilterId({ filterId }));
          return {
            filterGroup,
            filterId: attributeFilter?.id ?? '',
          };
        }),
      )),
      switchMap(result =>
        this.store$.select(selectFilterableLayersForApplication).pipe(
          map(filterableLayers => result ? { ...result, filterableLayers } : null),
        ),
      ),
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
    this.saveEnabled.set($event);
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
    });

  }

  public ngOnDestroy(): void {
    this.store$.dispatch(setApplicationSelectedFilterId({ filterId: undefined }));
  }
}
