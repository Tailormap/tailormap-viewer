import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, take } from 'rxjs';

@Component({
  selector: 'tm-password-reset-request-form',
  templateUrl: './password-reset-request-form.component.html',
  styleUrls: ['./password-reset-request-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PasswordResetRequestFormComponent {
  @Input() public requestReset$!: (email: string) => Observable<boolean>;
  // eslint-disable-next-line max-len
  private acceptedMessage = $localize`:@@shared.password-reset-request-form.accepted-message:Your request was accepted. If the email you provided is registered, you will receive an email with instructions to reset your password.`;
  private errorMessage = $localize`:@@shared.password-reset-request-form.error-message:An error occurred processing your request.`;
  private formBuilder = inject(FormBuilder);
  public requestResetForm = this.formBuilder.group({
    email: [ '', [ Validators.required, Validators.email ]],
  });
  private processingSubject = new BehaviorSubject(false);
  public processing$ = this.processingSubject.asObservable();
  private errorMessageSubject = new BehaviorSubject('');
  public errorMessage$ = this.errorMessageSubject.asObservable();
  private infoMessageSubject = new BehaviorSubject('');
  public infoMessage$ = this.infoMessageSubject.asObservable();

  public requestReset() {
    const email = this.requestResetForm.get('email')?.value;
    if (!email || !this.requestReset$) {
      return;
    }
    this.processingSubject.next(true);
    this.requestReset$(email)
      .pipe(take(1))
      .subscribe((success: boolean) => {
        if (success) {
          this.infoMessageSubject.next(this.acceptedMessage);
        } else {
          this.errorMessageSubject.next(this.errorMessage);
        }
        this.processingSubject.next(false);
        this.requestResetForm.reset();
      });
  }
}
