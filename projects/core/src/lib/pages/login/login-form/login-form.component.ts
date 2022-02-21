import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { SecurityService } from '../../../services/security.service';
import { BehaviorSubject, forkJoin, of, switchMap, take } from 'rxjs';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectRouteBeforeLogin } from '../../../state/core.selectors';
import { setRouteBeforeLogin } from '../../../state/core.actions';

@Component({
  selector: 'tm-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent implements OnInit {

  public loginForm = this.formBuilder.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  private loggingInSubject = new BehaviorSubject(false);
  public loggingIn$ = this.loggingInSubject.asObservable();

  private errorMessageSubject = new BehaviorSubject('');
  public errorMessage$ = this.errorMessageSubject.asObservable();

  constructor(
    private formBuilder: FormBuilder,
    private securityService: SecurityService,
    private router: Router,
    private store$: Store,
  ) { }

  public ngOnInit(): void {
  }

  public async login() {
    const username = this.loginForm.get('username')?.value;
    const password = this.loginForm.get('password')?.value;
    if (!username || !password) {
      return;
    }
    this.loggingInSubject.next(true);
    this.securityService.login$(username, password)
      .pipe(
        take(1),
        switchMap(success => {
          const beforeLoginUrl$ = this.store$.select(selectRouteBeforeLogin).pipe(take(1));
          return forkJoin([of(success), beforeLoginUrl$]);
        }),
      )
      .subscribe(([ success, beforeLoginUrl ]) => {
        this.loggingInSubject.next(false);
        if (success) {
          this.errorMessageSubject.next('');
          this.router.navigateByUrl(beforeLoginUrl || '/');
          this.store$.dispatch(setRouteBeforeLogin({ route: '' }));
        } else {
          this.errorMessageSubject.next($localize `Login failed, please try again`);
        }
      });
  }
}
