import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { debounceTime, Observable, Subject, takeUntil } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import {
  AUTHORIZATION_RULE_ANONYMOUS, AuthorizationRuleGroup, GeoServiceModel, GeoServiceProtocolEnum, GroupModel,
} from '@tailormap-admin/admin-api';
import { FormHelper } from '../../helpers/form.helper';
import { GeoServiceCreateModel } from '../models/geo-service-update.model';
import { StringHelper } from '@tailormap-viewer/shared';
import { GroupService } from '../../user/services/group.service';

@Component({
  selector: 'tm-admin-geo-service-form',
  templateUrl: './geo-service-form.component.html',
  styleUrls: ['./geo-service-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoServiceFormComponent implements OnInit {

  private destroyed = new Subject();
  private _geoService: GeoServiceModel | null = null;

  public protocols: GeoServiceProtocolEnum[] = [
    GeoServiceProtocolEnum.WMS, GeoServiceProtocolEnum.WMTS, GeoServiceProtocolEnum.XYZ, GeoServiceProtocolEnum.TILESET3D,
  ];
  private readonly XYZ_CRS_DEFAULT = 'EPSG:3857';

  @Input()
  public set geoService(geoService: GeoServiceModel | null) {
    this.geoServiceForm.patchValue({
      title: geoService ? geoService.title : '',
      protocol: geoService ? geoService.protocol : GeoServiceProtocolEnum.WMS,
      url: geoService ? geoService.url : '',
      xyzCrs: (geoService?.protocol === GeoServiceProtocolEnum.XYZ ? geoService.settings?.xyzCrs : null) || this.XYZ_CRS_DEFAULT,
      useProxy: geoService?.settings?.useProxy || false,
      username: geoService?.authentication?.username || '',
      password: geoService?.authentication?.password || '',
      authorizationRules: geoService ? geoService.authorizationRules : [AUTHORIZATION_RULE_ANONYMOUS],
    }, { emitEvent: false });
    if (!geoService) {
      this.geoServiceForm.get('protocol')?.enable();
    } else {
      this.geoServiceForm.get('protocol')?.disable({ emitEvent: false });
    }
    this._geoService = geoService;
  }

  public get geoService(): GeoServiceModel | null {
    return this._geoService;
  }

  @Output()
  public changed = new EventEmitter<GeoServiceCreateModel | null>();

  public geoServiceForm = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    protocol: new FormControl<GeoServiceProtocolEnum>(GeoServiceProtocolEnum.WMS, { nonNullable: true }),
    url: new FormControl('', { nonNullable: true }),
    xyzCrs: new FormControl(''),
    useProxy: new FormControl(false, { nonNullable: true }),
    username: new FormControl(''),
    password: new FormControl(''),
    authorizationRules: new FormControl<AuthorizationRuleGroup[]>([]),
  });

  public groups$: Observable<GroupModel[]>;
  constructor(groupDetailsService: GroupService) {
      this.groups$ = groupDetailsService.getGroups$();
  }

  private formHasAuthentication() {
    const value = this.geoServiceForm.getRawValue();
    return StringHelper.isNotBlank(value.username) && StringHelper.isNotBlank(value.password);
  }

  public isXyz() {
    return this.geoServiceForm.get('protocol')?.value === GeoServiceProtocolEnum.XYZ;
  }

  public ngOnInit(): void {
    this.geoServiceForm.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(250),
      )
      .subscribe(value => {
        if (!this.isValidForm()) {
          this.changed.emit(null);
          return;
        }
        const protocol = this.geoService ? this.geoService.protocol : (value.protocol || GeoServiceProtocolEnum.WMS);
        this.changed.emit({
          title: value.title || '',
          url: value.url || '',
          protocol,
          settings: {
            useProxy: value.useProxy,
            xyzCrs: protocol === GeoServiceProtocolEnum.XYZ ? value.xyzCrs || this.XYZ_CRS_DEFAULT : null,
          },
          authentication: !this.formHasAuthentication() ? null : {
            method: 'password',
            username: value.username as string,
            password: value.password as string,
          },
          authorizationRules: value.authorizationRules || [],
        });
      });
  }

  private isValidForm() {
    const values = this.geoServiceForm.getRawValue();
    return FormHelper.isValidValue(values.protocol)
      && FormHelper.isValidValue(values.url)
      && this.geoServiceForm.dirty;
  }

  public getAuthDescription() {
    const formHasAuthentication = this.formHasAuthentication();
    const proxyEnabled = this.geoServiceForm.getRawValue().useProxy;
    if (formHasAuthentication && proxyEnabled) {
      return $localize `:@@admin-core.catalog.credentials-set-and-proxy-enabled:Credentials set and proxy enabled`;
    } else if (formHasAuthentication) {
      return $localize `:@@admin-core.catalog.credentials-set:Credentials set`;
    } else if (proxyEnabled) {
      return $localize `:@@admin-core.catalog.proxy-enabled:Proxy enabled`;
    } else {
      return $localize `:@@admin-core.catalog.not-set:Not set`;
    }
  }
}
