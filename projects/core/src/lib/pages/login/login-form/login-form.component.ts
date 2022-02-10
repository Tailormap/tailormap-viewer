import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { SecurityService } from '../../../services/security.service';

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

  constructor(
    private formBuilder: FormBuilder,
    private securityService: SecurityService,
  ) { }

  public ngOnInit(): void {
  }

  public login() {
    const username = this.loginForm.get('username')?.value;
    const password = this.loginForm.get('password')?.value;
    if (!username || !password) {
      return;
    }
    this.securityService.login$(username, password);
  }
}
