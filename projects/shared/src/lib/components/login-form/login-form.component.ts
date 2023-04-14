import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { UserResponseModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent implements OnInit {

  @Input()
  public login$: ((username: string, password: string) => Observable<UserResponseModel>) | null = null;

  @Output()
  public loggedIn = new EventEmitter<UserResponseModel>();

  public loginForm = this.formBuilder.group({
    username: [ '', [Validators.required]],
    password: [ '', [Validators.required]],
  });

  private loggingInSubject = new BehaviorSubject(false);
  public loggingIn$ = this.loggingInSubject.asObservable();

  private errorMessageSubject = new BehaviorSubject('');
  public errorMessage$ = this.errorMessageSubject.asObservable();

  constructor(
    private formBuilder: FormBuilder,
  ) { }

  public ngOnInit(): void {
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
          this.errorMessageSubject.next($localize `Login failed, please try again`);
        }
      });
  }
}
