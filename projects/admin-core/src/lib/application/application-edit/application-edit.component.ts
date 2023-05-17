import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import {
  BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, take, takeUntil,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectApplicationsLoadStatus, selectDraftApplication, selectDraftApplicationUpdated } from '../state/application.selectors';
import { ApplicationModel } from '@tailormap-admin/admin-api';
import { RoutesEnum } from '../../routes';
import { clearSelectedApplication, setSelectedApplication } from '../state/application.actions';
import { ConfirmDialogService, LoadingStateEnum } from '@tailormap-viewer/shared';
import { ApplicationService } from '../services/application.service';

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
  public draftApplicationPristine$: Observable<boolean> = of(false);

  public readonly routes = RoutesEnum;

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private applicationService: ApplicationService,
    private confirmDelete: ConfirmDialogService,
    private router: Router,
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
    this.draftApplicationPristine$ = this.store$.select(selectDraftApplicationUpdated).pipe(map(updated => !updated));
  }

  public ngOnDestroy(): void {
    this.clearSelectedApplication();
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public save() {
    this.savingSubject.next(true);
    this.applicationService.saveDraftApplication$()
      .pipe(take(1))
      .subscribe(() => {
        this.savingSubject.next(false);
      });
  }

  public delete(application: ApplicationModel) {
    const title = application.title || application.name;
    this.confirmDelete.confirm$(
      `Delete application ${title}`,
      `Are you sure you want to delete application ${title}? This action cannot be undone.`,
      true,
    )
      .pipe(
        take(1),
        filter(answer => answer),
        switchMap(() => this.applicationService.deleteApplication$(application.id)),
      )
      .subscribe(() => {
        this.router.navigateByUrl('/applications');
      });
  }

  public clearSelectedApplication() {
    this.store$.dispatch(clearSelectedApplication());
  }

}
