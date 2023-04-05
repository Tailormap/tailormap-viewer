import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, take, takeUntil } from 'rxjs';
import { selectSelectedApplication } from '../state/application.selectors';
import { ApplicationModel } from '@tailormap-admin/admin-api';
import { ApplicationService } from '../services/application.service';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { setSelectedApplication } from '../state/application.actions';

@Component({
  selector: 'tm-admin-application-details',
  templateUrl: './application-details.component.html',
  styleUrls: ['./application-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationDetailsComponent implements OnInit, OnDestroy {

  public application$: Observable<ApplicationModel | null> = of(null);
  public updatedApplication: Omit<ApplicationModel, 'id'> | null = null;

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  private destroyed = new Subject();

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private applicationService: ApplicationService,
    private confirmDelete: ConfirmDialogService,
    private router: Router,
  ) { }

  public ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroyed),
      map(params => params.get('applicationId')),
      distinctUntilChanged(),
      filter((appId): appId is string => !!appId),
    ).subscribe(appId => {
      this.store$.dispatch(setSelectedApplication({ applicationId: appId }));
      this.updatedApplication = null;
    });
    this.application$ = this.store$.select(selectSelectedApplication);
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public save(id: string) {
    if (!this.updatedApplication) {
      return;
    }
    this.savingSubject.next(true);
    this.applicationService.updateApplication$(id, this.updatedApplication)
      .pipe(takeUntil(this.destroyed))
      .subscribe(success => {
        if (success) {
          this.updatedApplication = null;
        }
        this.savingSubject.next(false);
      });
  }

  public updateApplication($event: Omit<ApplicationModel, 'id'>) {
    this.updatedApplication = $event;
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

}
