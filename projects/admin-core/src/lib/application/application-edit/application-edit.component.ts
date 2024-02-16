import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import {
  BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, take, takeUntil, combineLatest,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  selectApplicationsLoadStatus, selectDraftApplication, selectDraftApplicationUpdated, selectDraftApplicationValid,
} from '../state/application.selectors';
import { ApplicationModel } from '@tailormap-admin/admin-api';
import { Routes } from '../../routes';
import { clearSelectedApplication, setSelectedApplication } from '../state/application.actions';
import { ConfirmDialogService, LoadingStateEnum } from '@tailormap-viewer/shared';
import { ApplicationService } from '../services/application.service';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';

@Component({
  selector: 'tm-admin-application-edit',
  templateUrl: './application-edit.component.html',
  styleUrls: ['./application-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationEditComponent implements OnInit, OnDestroy {

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  private destroyed = new Subject();
  public application$: Observable<ApplicationModel | null> = of(null);
  public canSave$: Observable<boolean> = of(false);

  public readonly routes = {
    APPLICATION_DETAILS_LAYERS: Routes.APPLICATION_DETAILS_LAYERS,
    APPLICATION_DETAILS_BASE_LAYERS: Routes.APPLICATION_DETAILS_BASE_LAYERS,
    APPLICATION_DETAILS_STYLING: Routes.APPLICATION_DETAILS_STYLING,
    APPLICATION_DETAILS_COMPONENTS: Routes.APPLICATION_DETAILS_COMPONENTS,
  };

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private applicationService: ApplicationService,
    private confirmDelete: ConfirmDialogService,
    private router: Router,
    private adminSnackbarService: AdminSnackbarService,
  ) {
  }

  public ngOnInit(): void {
    this.store$.select(selectApplicationsLoadStatus).pipe(
      filter(loadStatus => loadStatus === LoadingStateEnum.LOADED),
      switchMap(() => this.route.paramMap),
      takeUntil(this.destroyed),
      map(params => params.get('applicationId')),
      distinctUntilChanged(),
      filter((appId): appId is string => !!appId),
    ).subscribe(applicationId => {
      this.store$.dispatch(setSelectedApplication({ applicationId }));
    });
    this.application$ = this.store$.select(selectDraftApplication);
    this.canSave$ = combineLatest([
      this.store$.select(selectDraftApplicationUpdated),
      this.store$.select(selectDraftApplicationValid),
    ]).pipe(map(([ updated, valid ]) => updated && valid));
  }

  public ngOnDestroy(): void {
    this.store$.dispatch(clearSelectedApplication());
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public save() {
    this.savingSubject.next(true);
    this.applicationService.saveDraftApplication$()
      .pipe(take(1))
      .subscribe(() => {
        this.adminSnackbarService.showMessage($localize `:@@admin-core.application.application-updated:Application updated`);
        this.savingSubject.next(false);
      });
  }

  public delete(application: ApplicationModel) {
    const title = application.title || application.name;
    this.confirmDelete.confirm$(
      $localize `:@@admin-core.application.delete-application:Delete application ${title}`,
      $localize `:@@admin-core.application.delete-application-message:Are you sure you want to delete application ${title}? This action cannot be undone.`,
      true,
    )
      .pipe(
        take(1),
        filter(answer => answer),
        switchMap(() => this.applicationService.deleteApplication$(application.id)),
      )
      .subscribe(() => {
        this.adminSnackbarService.showMessage($localize `:@@admin-core.application.application-removed:Application ${title} removed`);
        this.router.navigateByUrl('/admin/applications');
      });
  }

}
