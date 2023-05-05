import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, distinctUntilChanged, filter, Observable, of, Subject, switchMap, take, takeUntil } from 'rxjs';
import { selectDraftApplication } from '../state/application.selectors';
import { ApplicationModel } from '@tailormap-admin/admin-api';
import { ApplicationService } from '../services/application.service';
import { ConfirmDialogService } from '@tailormap-viewer/shared';
import { clearSelectedApplication, updateApplication, updateDraftApplication } from '../state/application.actions';

@Component({
  selector: 'tm-admin-application-edit-settings',
  templateUrl: './application-edit-settings.component.html',
  styleUrls: ['./application-edit-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationEditSettingsComponent implements OnInit, OnDestroy {

  public application$: Observable<ApplicationModel | null> = of(null);
  public updatedApplication: Omit<ApplicationModel, 'id'> | null = null;

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  private destroyed = new Subject();

  constructor(
    private store$: Store,
    private applicationService: ApplicationService,
    private confirmDelete: ConfirmDialogService,
    private router: Router,
  ) { }

  public ngOnInit(): void {
    this.application$ = this.store$.select(selectDraftApplication)
      .pipe(
        distinctUntilChanged((a, b) => {
          return a?.id === b?.id;
        }),
      );
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
    this.store$.dispatch(updateDraftApplication({ application: $event }));
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
