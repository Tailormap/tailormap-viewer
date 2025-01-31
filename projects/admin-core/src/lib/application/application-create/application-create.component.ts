import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { ApplicationService } from '../services/application.service';
import { Router } from '@angular/router';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { UpdateDraftApplicationModel } from '../models/update-draft-application.model';

@Component({
  selector: 'tm-admin-application-create',
  templateUrl: './application-create.component.html',
  styleUrls: ['./application-create.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationCreateComponent implements OnDestroy {

  private savingSubject = new BehaviorSubject(false);
  private destroyed = new Subject();

  public saving$ = this.savingSubject.asObservable();
  public applicationCreateModel: UpdateDraftApplicationModel | null = null;

  public formValid: boolean = true;

  constructor(
    private applicationService: ApplicationService,
    private router: Router,
    private adminSnackbarService: AdminSnackbarService,
  ) { }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateApplication($event: UpdateDraftApplicationModel) {
    this.applicationCreateModel = $event;
  }

  public save() {
    if (!this.applicationCreateModel) {
      return;
    }
    this.savingSubject.next(true);
    const application = this.applicationCreateModel.application;
    application.settings = { layerSettings: {} };
    if (this.applicationCreateModel.i18nSettings) {
      application.settings.i18nSettings = this.applicationCreateModel.i18nSettings;
    }
    if (this.applicationCreateModel.uiSettings) {
      application.settings.uiSettings = this.applicationCreateModel.uiSettings;
    }
    this.applicationService.createApplication$(application)
      .pipe(takeUntil(this.destroyed))
      .subscribe(createdApplication => {
        if (createdApplication) {
          // eslint-disable-next-line max-len
          this.adminSnackbarService.showMessage($localize `:@@admin-core.application.application-created:Application ${createdApplication.title || createdApplication.name} created`);
          this.router.navigateByUrl('/admin/applications/application/' + createdApplication.id);
        }
        this.savingSubject.next(false);
      });
  }

  public validApplicationChanged($event: boolean) {
    this.formValid = $event;
  }

}
