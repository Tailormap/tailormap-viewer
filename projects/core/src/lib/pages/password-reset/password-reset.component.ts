import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { TailormapSecurityApiV1Service, ValidatorsHelper } from '@tailormap-viewer/api';

interface Token {
  uuid: string;
  tokenValidUntil: Date | null;
}

@Component({
  selector: 'tm-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PasswordResetComponent implements OnInit {
  private static minPasswordLength = 8;
  public token: Token = {
    uuid: '', tokenValidUntil: null,
  };
  private securityApiService = inject(TailormapSecurityApiV1Service);
  private errorMessageSubject = new BehaviorSubject('');
  public errorMessage$ = this.errorMessageSubject.asObservable();
  private infoMessageSubject = new BehaviorSubject('');
  public infoMessage$ = this.infoMessageSubject.asObservable();

  private formBuilder = inject(FormBuilder);
  public passwordResetForm = this.formBuilder.group({
    username: new FormControl<string>('', {
      nonNullable: true, validators: [ Validators.required, Validators.pattern(ValidatorsHelper.NAME_REGEX) ],
    }),

    newPassword: new FormControl<string>('', {
      nonNullable: true,
      validators: [ Validators.required, Validators.minLength(PasswordResetComponent.minPasswordLength) ],
      asyncValidators: [this.passwordStrengthValidator()],
    }),

    confirmedPassword: new FormControl<string>('', {
      nonNullable: true, validators: [ Validators.required, (control: AbstractControl) => {
        if (!control?.value) return null;
        if (this.passwordResetForm?.value?.newPassword !== control.value) {
          return { passwordMismatch: true };
        }
        return null;
      } ],
    }),

  });

  public ngOnInit(): void {
    // token is a base64 encoded string with uuid#validUntil
    // validUntil is a number representing seconds since epoch
    // example: a3f5c8e2-9f3b-4c6d-8e2a-9f3b4c6d8e2a#1760013815
    // base64 encoded: YTNmNWM4ZTItOWYzYi00YzZkLThlMmEtOWYzYjRjNmQ4ZTJhIzIwMjQtMTItMzFUMjM6NTk6NTkuOTk5Wg==
    const tokenString = atob(decodeURIComponent(window.location.href.split('/').pop() || ''));
    this.token.uuid = tokenString.split('#')[0] || '';
    this.token.tokenValidUntil = tokenString.split('#')[1] ? new Date(Number(tokenString.split('#')[1]) * 1000) : null;
    this.tokenIsValid();
  }

  public savePassword() {
    if (this.passwordResetForm.valid && this.tokenIsValid()) {
      // send token, username and new password to backend
      this.securityApiService.resetPassword$(this.token.uuid, this.passwordResetForm.value.username ?? '', this.passwordResetForm.value.newPassword ?? '')
        .subscribe({
          next: (result) => {
            if (result) {
              this.errorMessageSubject.next('');
              this.infoMessageSubject.next(
                $localize`:@@core.password-reset-form.success:Password successfully reset, you can now log in with your new password.`);
            } else {
              this.infoMessageSubject.next('');
              this.errorMessageSubject.next(
                $localize`:@@core.password-reset-form.error-saving:Error saving password, please check the validity of your reset link, username and password and try again.`);
            }
            this.passwordResetForm.reset();
          }, error: (error) => {
            this.infoMessageSubject.next('');
            this.errorMessageSubject.next(
              $localize`:@@core.password-reset-form.error-reset:Error resetting password: ${(error?.error?.message || error?.message || error.toString())}`);
            this.passwordResetForm.reset();
          },
        });
    }
  }

  protected tokenIsValid(): boolean {
    const isValid = !!(this.token.uuid && this.token.uuid.length > 0 && this.token.tokenValidUntil && this.token.tokenValidUntil > new Date());
    if (!isValid) {
      this.errorMessageSubject.next($localize`:@@core.password-reset-form.error.token-expired:Your password reset token is invalid or has expired.`);
    }
    return isValid;
  }

  private passwordStrengthValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.length < PasswordResetComponent.minPasswordLength) {
        return of(null);
      }
      return this.securityApiService.validatePasswordStrength$(control.value).pipe(map((result: boolean) => {
        return result ? null : { weakPassword: true };
      }));
    };
  }
}
