import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ApplicationModel } from '@tailormap-admin/admin-api';
import { distinctUntilChanged, map, Observable, of, Subject, take, takeUntil, combineLatest, concatMap } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { clearSelectedApplication, loadApplications, setApplicationListFilter } from '../state/application.actions';
import {
  selectApplicationList, selectApplicationsLoadError, selectApplicationsLoadStatus, selectSelectedApplicationId,
} from '../state/application.selectors';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { environment } from '../../../../../admin-app/src/environments/environment';
import { ConfigService } from '../../config/services/config.service';

@Component({
  selector: 'tm-admin-application-list',
  templateUrl: './application-list.component.html',
  styleUrls: ['./application-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationListComponent implements OnInit, OnDestroy {

  public filter = new FormControl('');
  public applications$: Observable<Array<ApplicationModel & { selected: boolean; defaultApplication: boolean }>> = of([]);
  public applicationsLoadStatus$: Observable<LoadingStateEnum> = of(LoadingStateEnum.INITIAL);
  public errorMessage$: Observable<string | undefined> = of(undefined);

  public viewerBaseUrl = environment.viewerBaseUrl;

  private destroyed = new Subject();

  constructor(
    private store$: Store,
    private route: ActivatedRoute,
    private router: Router,
    private configService: ConfigService,
  ) {}

  public ngOnInit(): void {
    this.filter.valueChanges
      .pipe(takeUntil(this.destroyed))
      .subscribe(value => {
        this.store$.dispatch(setApplicationListFilter({ filter: value }));
      });
    this.applicationsLoadStatus$ = this.store$.select(selectApplicationsLoadStatus);
    this.errorMessage$ = this.store$.select(selectApplicationsLoadError);
    this.applications$ = this.configService.getConfigValue$(ConfigService.DEFAULT_APPLICATION_KEY)
      .pipe(
        distinctUntilChanged(),
        concatMap(defaultApplication => {
          return combineLatest([
            this.store$.select(selectApplicationList),
            this.store$.select(selectSelectedApplicationId).pipe(distinctUntilChanged()),
            of(defaultApplication),
          ]);
        }),
        map(([ applications, selectedApplicationId, defaultApplication ]) => {
          return applications.map(a => ({
            ...a,
            selected: a.id === selectedApplicationId,
            defaultApplication: a.name === defaultApplication,
          })).sort((a, b) => {
            if (a.name === defaultApplication) {
              return -1;
            }
            if (b.name === defaultApplication) {
              return 1;
            }
            return (a.title || a.name).toLocaleLowerCase()
              .localeCompare((b.title || b.name).toLocaleLowerCase());
          });
        }),
    );
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

  public stopPropagation(event: Event) {
    event.stopPropagation();
  }

}
