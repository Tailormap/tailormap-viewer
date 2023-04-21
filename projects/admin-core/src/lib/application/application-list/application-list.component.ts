import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ApplicationModel } from '@tailormap-admin/admin-api';
import { distinctUntilChanged, Observable, of, Subject, take, takeUntil } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { clearSelectedApplication, loadApplications, setApplicationListFilter } from '../state/application.actions';
import {
  selectApplicationList, selectApplicationsLoadError, selectApplicationsLoadStatus, selectSelectedApplicationId,
} from '../state/application.selectors';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingStateEnum } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-admin-application-list',
  templateUrl: './application-list.component.html',
  styleUrls: ['./application-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationListComponent implements OnInit, OnDestroy {

  public filter = new FormControl('');
  public applications$: Observable<ApplicationModel[]> = of([]);
  public selectedApplicationId: string | null | undefined;
  public applicationsLoadStatus$: Observable<LoadingStateEnum> = of(LoadingStateEnum.INITIAL);
  public errorMessage$: Observable<string | undefined> = of(undefined);

  private destroyed = new Subject();

  constructor(
    private store$: Store,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  public ngOnInit(): void {
    this.filter.valueChanges
      .pipe(takeUntil(this.destroyed))
      .subscribe(value => {
        this.store$.dispatch(setApplicationListFilter({ filter: value }));
      });
    this.applicationsLoadStatus$ = this.store$.select(selectApplicationsLoadStatus);
    this.errorMessage$ = this.store$.select(selectApplicationsLoadError);
    this.applications$ = this.store$.select(selectApplicationList);
    this.store$.select(selectSelectedApplicationId)
      .pipe(takeUntil(this.destroyed), distinctUntilChanged())
      .subscribe(appId => {
        this.selectedApplicationId = appId;
        this.cdr.detectChanges();
      });
    this.applicationsLoadStatus$
      .pipe(take(1))
      .subscribe(loadStatus => {
        if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.FAILED) {
          this.store$.dispatch(loadApplications());
        }
      });
  }

  public ngOnDestroy(): void {
    this.store$.dispatch(clearSelectedApplication());
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public onRetryClick() {
    this.store$.dispatch(loadApplications());
  }

}
