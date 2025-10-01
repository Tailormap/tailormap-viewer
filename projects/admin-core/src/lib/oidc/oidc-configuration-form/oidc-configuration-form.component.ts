import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { OIDCConfigurationModel, UploadCategoryEnum } from '@tailormap-admin/admin-api';
import { debounceTime, filter, Subject, takeUntil } from 'rxjs';
import { FormHelper } from '../../helpers/form.helper';
import { UPLOAD_REMOVE_SERVICE } from '../../shared/components/select-upload/models/upload-remove-service.injection-token';
import { OidcImageRemoveService } from '../services/oidc-image-remove.service';

@Component({
  selector: 'tm-admin-oidc-configuration-form',
  templateUrl: './oidc-configuration-form.component.html',
  styleUrls: ['./oidc-configuration-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UPLOAD_REMOVE_SERVICE, useClass: OidcImageRemoveService },
  ],
  standalone: false,
})
export class OIDCConfigurationFormComponent implements OnInit, OnDestroy {

  private _oidcConfiguration: OIDCConfigurationModel | null = null;

  public imageCategory = UploadCategoryEnum.SSO_IMAGE;

  @Input()
  public set oidcConfiguration(oidcConfiguration: OIDCConfigurationModel | null) {
    this._oidcConfiguration = oidcConfiguration;
    this.initForm(oidcConfiguration);
  }
  public get oidcConfiguration(): OIDCConfigurationModel | null {
    return this._oidcConfiguration;
  }

  public get redirectUrl(): string | undefined {
      return `${window.location.protocol}//${window.location.host}/api/oauth2/callback`;
  }

  @Output()
  public updateOIDCConfiguration = new EventEmitter<Omit<OIDCConfigurationModel, 'id'>>();

  public oidcConfigurationForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
      ],
    }),
    issuerUrl: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    clientId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    clientSecret: new FormControl(''),
    userNameAttribute: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    image: new FormControl<string | null>(null),
  });


  private destroyed = new Subject();

  public ngOnInit(): void {
    this.oidcConfigurationForm.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(250),
        filter(() => this.isValidForm()),
      )
      .subscribe(value => {
        this.updateOIDCConfiguration.emit({
          name: value.name || '',
          issuerUrl: value.issuerUrl || '',
          clientId: value.clientId || '',
          clientSecret: value.clientSecret || undefined,
          userNameAttribute: value.userNameAttribute || 'name',
          image: value.image,
        });
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private initForm(oidcConfiguration: OIDCConfigurationModel | null) {
    this.oidcConfigurationForm.patchValue({
      name: oidcConfiguration?.name ?? '',
      issuerUrl: oidcConfiguration?.issuerUrl ?? '',
      clientId: oidcConfiguration?.clientId ?? '',
      clientSecret: oidcConfiguration?.clientSecret,
      userNameAttribute: oidcConfiguration?.userNameAttribute ?? 'name',
      image: oidcConfiguration?.image ?? null,
    }, { emitEvent: false });
  }

  private isValidForm(): boolean {
    const values = this.oidcConfigurationForm.getRawValue();
    return FormHelper.isValidValue(values.name)
      && FormHelper.isValidValue(values.issuerUrl)
      && FormHelper.isValidValue(values.clientId)
      && FormHelper.isValidValue(values.clientSecret)
      && FormHelper.isValidValue(values.userNameAttribute)
      && this.oidcConfigurationForm.dirty
      && this.oidcConfigurationForm.valid;
  }

  public onImageChanged($event: string | null) {
    this.oidcConfigurationForm.patchValue({ image: $event }, { emitEvent: true });
  }

}
