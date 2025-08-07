import { Component, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { FormModel } from '@tailormap-admin/admin-api';
import { FormService } from '../services/form.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-form-create',
  templateUrl: './form-create.component.html',
  styleUrls: ['./form-create.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FormCreateComponent {
  private formService = inject(FormService);
  private router = inject(Router);
  private adminSnackbarService = inject(AdminSnackbarService);
  private destroyRef = inject(DestroyRef);


  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();
  public formCreateModel: { form: Omit<FormModel, 'id'> } | null = null;

  public formValid: boolean = true;

  public updateForm($event: { form: Omit<FormModel, 'id'> }) {
    this.formCreateModel = $event;
  }

  public save() {
    if (!this.formCreateModel) {
      return;
    }
    this.savingSubject.next(true);
    const form = this.formCreateModel.form;
    this.formService.createForm$(form)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(createdForm => {
        if (createdForm) {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.form.form-created:Form ${createdForm.name} created`);
          this.router.navigateByUrl('/admin/forms/form/' + createdForm.id);
        }
        this.savingSubject.next(false);
      });
  }

  public validFormChanged($event: boolean) {
    this.formValid = $event;
  }

}
