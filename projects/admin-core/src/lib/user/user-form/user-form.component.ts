import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { GroupModel, UserModel } from '@tailormap-admin/admin-api';
import { AbstractControl, AsyncValidatorFn, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { debounceTime, filter, map, Observable, of, Subject, switchMap, takeUntil, timer } from 'rxjs';
import { GroupService } from '../services/group.service';
import { formatDate } from '@angular/common';
import { NAME_REGEX } from '../constants';
import { UserService } from '../services/user.service';
import { UserAddUpdateModel } from '../models/user-add-update.model';

@Component({
  selector: 'tm-admin-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent implements OnInit, OnDestroy {

  public userForm = new FormGroup({
    username: new FormControl<string>('', {
      nonNullable: true,
      validators: [ Validators.required, Validators.pattern(NAME_REGEX) ],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [ Validators.required, Validators.minLength(8) ],
      asyncValidators: [this.passwordStrengthValidator()],
      updateOn: 'blur',
    }),
    confirmedPassword: new FormControl<string>('', { nonNullable: true, validators: [ Validators.required, Validators.minLength(8) ] }),
    email: new FormControl<string>('', { nonNullable: false, validators: [Validators.email] }),
    name: new FormControl<string>('', { nonNullable: false }),
    enabled: new FormControl<boolean>(true, { nonNullable: true }),
    validUntil: new FormControl<string>('', { nonNullable: false }),
    groups: new FormControl<string[]>([], { nonNullable: false }),
  }, {
    validators: [
      this.passwordValidator('password', 'confirmedPassword'),
    ],
  });

  @Input()
  public set user(user: UserModel | null) {
    this._user = user;
    this.userForm.patchValue({
      password: undefined,
      confirmedPassword: undefined,
      username: user ? user.username : '',
      email: user ? user.email : '',
      name: user ? user.name : '',
      enabled: user ? user.enabled : true,
      // HTML input expects 2023-10-27T01:22:00.000, it seems problematic to set a Date object
      validUntil: (user && user.validUntil) ? formatDate(user.validUntil, 'yyyy-MM-ddTHH:mm:ss', 'en') : null,
      groups: user ? user.groupNames : [],
    });
    const defaultPasswordValidator = [Validators.minLength(8)];
    this.userForm.get('password')?.setValidators(user ? defaultPasswordValidator : [ Validators.required, ...defaultPasswordValidator ]);
    this.userForm.get('confirmedPassword')?.setValidators(user ? defaultPasswordValidator : [ Validators.required, ...defaultPasswordValidator ]);
    if (user) {
      this.userForm.get('username')?.disable();
    } else {
      this.userForm.get('username')?.enable();
    }
  }
  public get user(): UserModel | null {
    return this._user;
  }

  @Output()
  public userUpdated = new EventEmitter<UserAddUpdateModel>();

  public allGroups$: Observable<GroupModel[]> | undefined;
  private destroyed = new Subject();
  private _user: UserModel | null = null;

  constructor(
    private groupDetailsService: GroupService,
    private userDetailsService: UserService,
  ) {
    this.allGroups$ = this.groupDetailsService.getGroups$();
  }

  public ngOnInit(): void {
    this.userForm.valueChanges.pipe(
      takeUntil(this.destroyed),
      debounceTime(250),
      filter(() => this.userForm.valid),
    )
    .subscribe(() => {
      this.readForm();
    });
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private readForm() {
    const validUntilFromFormValue = this.userForm.get('validUntil')?.value || null;
    const user: UserAddUpdateModel = {
      username: this.userForm.get('username')?.value || '',
      email: this.userForm.get('email')?.value || null,
      name: this.userForm.get('name')?.value || null,
      enabled: this.userForm.get('enabled')?.value || false,
      validUntil: validUntilFromFormValue ? new Date(validUntilFromFormValue) : null,
      groups: this.userForm.get('groups')?.value || [],
    };
    const passwd = this.userForm.get('password')?.value || '';
    if (passwd.length > 0) {
      // we only want the password if it has a value/was changed
      user.password = passwd;
    }
    if(user.groups && user.groups.length > 0) {
      user.groups = user.groups.map(g => `/${g}`);
    }
    this.userUpdated.emit(user);
  }

  private passwordValidator(controlName: string, matchControlName: string): ValidatorFn {
    return (controls: AbstractControl) => {
      const control = controls.get(controlName);
      const matchControl = controls.get(matchControlName);

      if (!matchControl?.errors && control?.value !== matchControl?.value) {
        matchControl?.setErrors({
          matching: {
            actualValue: matchControl?.value,
            requiredValue: control?.value,
          },
        });
        return { matching: true };
      }
      return null;
    };
  }

  private passwordStrengthValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value < 8) {
        return of(null);
      }
      return this.userDetailsService.validatePasswordStrength$(control.value).pipe(
        map((result: boolean) => {
          return result ? null : { weakPassword: true };
        }),
      );
    };
  }

}
