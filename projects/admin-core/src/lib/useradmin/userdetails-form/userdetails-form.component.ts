import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { GroupModel, UserModel } from '@tailormap-admin/admin-api';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { debounceTime, filter, Observable, Subject, takeUntil } from 'rxjs';
import { UserDetailsService } from '../services/userdetails.service';
import { GroupdetailsService } from '../services/groupdetails.service';
import { formatDate } from '@angular/common';

@Component({
  selector: 'tm-admin-userdetails-form',
  templateUrl: './userdetails-form.component.html',
  styleUrls: ['./userdetails-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserdetailsFormComponent implements OnInit, OnDestroy {
  public userdetailsForm = new FormGroup({
    username: new FormControl<string>('', {
      nonNullable: true, validators: [ Validators.required, Validators.pattern('[a-zA-Z0-9]*') ],
    }),
    password: new FormControl<string>('', { nonNullable: true, validators: Validators.minLength(8) }),
    confirmedPassword: new FormControl<string>('', { nonNullable: true, validators: Validators.minLength(8) }),
    email: new FormControl<string>('', { nonNullable: false, validators: Validators.email }),
    name: new FormControl<string>('', { nonNullable: false }),
    enabled: new FormControl<boolean>(false, { nonNullable: true }),
    validUntil: new FormControl<string>('', { nonNullable: false }),
    groups: new FormControl<GroupModel[]>([], { nonNullable: false }),
  }, {
    validators: [
      this.passwordValidator('password', 'confirmedPassword'),
    ],
  });
  public existingUser = false;
  public allGroups$: Observable<GroupModel[]>;
  private destroyed = new Subject();
  private _user: UserModel | null = null;

  constructor(
    private userDetailsService: UserDetailsService, private groupDetailsService: GroupdetailsService,
  ) {
    this.allGroups$ = this.groupDetailsService.groupList$;
  }

  public ngOnInit(): void {
    this.userdetailsForm.valueChanges.pipe(
      takeUntil(this.destroyed),
      debounceTime(250),
      filter(() => this.userdetailsForm.valid))
      .subscribe(() => this.readForm());

    this.userDetailsService.selectedUser$.pipe(
      takeUntil(this.destroyed))
      .subscribe(user => {
        this._user = user;
        this.userdetailsForm.patchValue({
          password: undefined,
          confirmedPassword: undefined,
          username: user ? user.username : '',
          email: user ? user.email : '',
          name: user ? user.name : '',
          enabled: user ? user.enabled : false,
          // HTML input expects 2023-10-27T01:22:00.000, it seems problematic to set a Date object
          validUntil: (user && user.validUntil) ? formatDate(user.validUntil, 'yyyy-MM-ddTHH:mm:ss', 'en') : null,
          groups: user ? user.groups : [],
        });

        this.existingUser = (user!=null && user?.username.length > 0);
      });
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public addOrUpdate() {
    if (null !== this._user) {
      if(this._user.groups && this._user.groups.length > 0) {
        this._user.groups = this._user.groups.map(g => (g._links.self.href));
      }
      this.userDetailsService.addOrUpdateUser(!this.existingUser, this._user);
      this.clearForm();
    }
  }

  public clearForm() {
    this.userdetailsForm.reset({
      password: undefined,
      confirmedPassword: undefined,
      username: '',
      email: '',
      name: '',
      enabled: false,
      validUntil: undefined,
      groups: [],
    });
    this.existingUser = false;
    this._user = null;
  }

  public delete() {
    const userName = this.userdetailsForm.get('username')?.value || '';
    if (userName.length > 0) {
      this.userDetailsService.deleteUser$(userName);
      this.clearForm();
    }
  }

  /**
   * Compare two groups by name(the primary key).
   *
   * Used in the template to check if a group is to be selected.
   *
   * @param grpSrc
   * @param grpTarget
   */
  public compareGroup(grpSrc: { name: string }, grpTarget: { name: string }) {
    return grpSrc && grpTarget && grpSrc.name === grpTarget.name;
  }

  private readForm() {
    const validUntilFromFormValue = this.userdetailsForm.get('validUntil')?.value || null;

    this._user = {
      username: this.userdetailsForm.get('username')?.value || '',
      email: this.userdetailsForm.get('email')?.value || null,
      name: this.userdetailsForm.get('name')?.value || null,
      enabled: this.userdetailsForm.get('enabled')?.value || false,
      validUntil: validUntilFromFormValue ? new Date(validUntilFromFormValue) : null,
      groups: this.userdetailsForm.get('groups')?.value || [],
    };
    const passwd = this.userdetailsForm.get('password')?.value || '';
    if (passwd.length > 0) {
      // we only want the password if it has a value/was changed
      this._user.password = passwd;
    }
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
}
