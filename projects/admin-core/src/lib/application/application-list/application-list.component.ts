import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ApplicationModel } from '@tailormap-admin/admin-api';
import { Observable, of, Subject, take, takeUntil } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { loadApplications, setApplicationListFilter } from '../state/application.actions';
import { selectApplicationList, selectApplicationsLoadError, selectApplicationsLoadStatus } from '../state/application.selectors';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { RoutesEnum } from '../../routes';

@Component({
  selector: 'tm-admin-application-list',
  templateUrl: './application-list.component.html',
  styleUrls: ['./application-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationListComponent implements OnInit, OnDestroy {

  public filter = new FormControl('');
  public applications$: Observable<ApplicationModel[]> = of([]);
  public selectedApplicationId: string | null = null;
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
    this.route.url
      .pipe(takeUntil(this.destroyed))
      .subscribe(() => {
        this.selectedApplicationId = this.readSelectedApplicationFromUrl();
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
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private readSelectedApplicationFromUrl(): string | null {
    const currentRoute = this.router.url
      .replace(RoutesEnum.APPLICATION, '')
      .split('/')
      .filter(part => !!part);
    if (currentRoute.length >= 2 && currentRoute[0] === 'application') {
      return currentRoute[1];
    }
    return null;
  }

  public onRetryClick() {
    this.store$.dispatch(loadApplications());
  }
}
