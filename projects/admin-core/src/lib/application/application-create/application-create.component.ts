import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ApplicationModel } from '@tailormap-admin/admin-api';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { ApplicationService } from '../services/application.service';
import { Router } from '@angular/router';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';

@Component({
  selector: 'tm-admin-application-create',
  templateUrl: './application-create.component.html',
  styleUrls: ['./application-create.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationCreateComponent implements OnDestroy {

  private savingSubject = new BehaviorSubject(false);
  private destroyed = new Subject();

  public saving$ = this.savingSubject.asObservable();
  public application: Omit<ApplicationModel, 'id'> | null = null;

  constructor(
    private applicationService: ApplicationService,
    private router: Router,
    private adminSnackbarService: AdminSnackbarService,
  ) { }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateApplication($event: Omit<ApplicationModel, 'id'>) {
    this.application = $event;
  }

  public save() {
    if (!this.application) {
      return;
    }
    this.savingSubject.next(true);
    this.applicationService.createApplication$(this.application)
      .pipe(takeUntil(this.destroyed))
      .subscribe(createdApplication => {
        if (createdApplication) {
          this.adminSnackbarService.showMessage($localize `Application ${createdApplication.title || createdApplication.name} created`);
          this.router.navigateByUrl('/applications/application/' + createdApplication.id);
        }
        this.savingSubject.next(false);
      });
  }
}
