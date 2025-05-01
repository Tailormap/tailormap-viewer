import { Component, ChangeDetectionStrategy, DestroyRef, Signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, Observable, switchMap, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectFilterGroups, selectSelectedApplicationId } from '../../state/application.selectors';
import { AttributeFilterModel } from '@tailormap-viewer/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { AdminSnackbarService } from '../../../shared/services/admin-snackbar.service';
import { deleteApplicationFilterGroup } from '../../state/application.actions';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'tm-admin-application-edit-filter',
  templateUrl: './application-edit-filter.component.html',
  styleUrls: ['./application-edit-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationEditFilterComponent {

  public filter$: Observable<AttributeFilterModel | null>;

  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private destroyRef: DestroyRef,
    private confirmDelete: ConfirmDialogService,
    private adminSnackbarService: AdminSnackbarService,
    private router: Router,
  ) {
    this.filter$ = this.route.params.pipe(
      takeUntilDestroyed(this.destroyRef),
      map(params => params['filterId']),
      switchMap(filterId => this.store$.select(selectFilterGroups).pipe(
        map(filterGroups => {
          for (const filterGroup of filterGroups) {
            const attributeFilter = filterGroup.filters.find(filterInGroup => filterInGroup.id === filterId);
            if (attributeFilter) {
              return attributeFilter;
            }
          }
          return null;
        }),
      )),
    );
  }

  public delete(attributeFilter: AttributeFilterModel) {
    this.confirmDelete.confirm$(
      $localize `:@@admin-core.applications.filters.delete-filter:Delete filter ${attributeFilter.id}`,
      $localize `:@@admin-core.applications.filters.delete-filter-message:Are you sure you want to delete form ${attributeFilter.id}? This action cannot be undone.`,
      true,
    )
      .pipe(
        take(1),
        filter(answer => answer),
        tap(() => this.store$.dispatch(deleteApplicationFilterGroup({ filterId: attributeFilter.id }))),
      )
      .subscribe(() => {
        this.adminSnackbarService.showMessage($localize `:@@admin-core.applications.filters.filter-removed:Filter ${attributeFilter.id} removed`);
        this.router.navigateByUrl('/admin/applications/application/' + this.applicationId() + '/filters');
      });
  }
}
