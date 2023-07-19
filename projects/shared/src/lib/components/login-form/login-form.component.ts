import { LocationStrategy } from '@angular/common';
import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { LoginConfigurationModel } from '@tailormap-viewer/api';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectUserDetails } from '../../../../../core/src/lib/state/core.selectors';

interface LoginModel {
  isAuthenticated: boolean;
  username: string;
  roles: string[];
}

@Component({
  selector: 'tm-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent implements OnInit{

  @Input()
  public login$: ((username: string, password: string) => Observable<LoginModel>) | null = null;

  @Input({ required: true })
  public loginErrorMessage: string | undefined;

  @Input()
  public isViewer = false;

  @Output()
  public loggedIn = new EventEmitter<LoginModel>();

  @Input()
  public redirectUrl: string | null | undefined;

  public loginForm = this.formBuilder.group({
    username: [ '', [Validators.required]],
    password: [ '', [Validators.required]],
  });

  private loggingInSubject = new BehaviorSubject(false);
  public loggingIn$ = this.loggingInSubject.asObservable();

  private errorMessageSubject = new BehaviorSubject('');
  public errorMessage$ = this.errorMessageSubject.asObservable();

  @Input()
  public loginConfiguration: LoginConfigurationModel | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private locationStrategy: LocationStrategy,
    private store$: Store,
  ) { }

  public ngOnInit() {
    this.store$.select(selectUserDetails)
      .pipe(take(1))
      .subscribe(secModel => {
        if(secModel.isAuthenticated) {
          this.errorMessageSubject.next(`You are logged in as ${secModel.username} but do not have proper roles to access the application. Please contact your administrator.`);
        }
      });
  }
  public login() {
    const username = this.loginForm.get('username')?.value;
    const password = this.loginForm.get('password')?.value;
    if (!username || !password || !this.login$) {
      return;
    }
    this.loggingInSubject.next(true);
    this.login$(username, password)
      .pipe(take(1))
      .subscribe(userResponse => {
        this.loggingInSubject.next(false);
        if (userResponse.isAuthenticated) {
          this.errorMessageSubject.next('');
          this.loggedIn.emit(userResponse);
        } else {
          this.errorMessageSubject.next(this.loginErrorMessage || 'Login failed, please try again');
        }
      });
  }

  public loginSSO(ssoUrl: string) {
    if (this.redirectUrl !== undefined && this.redirectUrl !== null) {
      if (ssoUrl.indexOf('?') < 0) {
          ssoUrl += '?';
      } else {
          ssoUrl += '&';
      }

      ssoUrl += `redirectUrl=${encodeURIComponent(this.locationStrategy.prepareExternalUrl(this.redirectUrl))}`;
    }

    window.location.href = ssoUrl;
  }
}
