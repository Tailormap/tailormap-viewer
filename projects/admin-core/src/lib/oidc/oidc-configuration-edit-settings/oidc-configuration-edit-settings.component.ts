import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, Observable, of, take } from 'rxjs';
import { selectDraftOIDCConfiguration } from '../state/oidc-configuration.selectors';
import { OIDCConfigurationModel } from '@tailormap-admin/admin-api';
import { updateDraftOIDCConfiguration } from '../state/oidc-configuration.actions';
import { ConfigService } from '../../config/services/config.service';

@Component({
  selector: 'tm-admin-oidc-configuration-edit-settings',
  templateUrl: './oidc-configuration-edit-settings.component.html',
  styleUrls: ['./oidc-configuration-edit-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OIDCConfigurationEditSettingsComponent implements OnInit {

  public oidcConfiguration$: Observable<OIDCConfigurationModel | undefined | null> = of(null);

  constructor(
    private store$: Store,
    private configService: ConfigService,
  ) { }

  public ngOnInit(): void {
    this.oidcConfiguration$ = this.store$.select(selectDraftOIDCConfiguration)
      .pipe(
        distinctUntilChanged((a, b) => {
          return a?.id === b?.id && a?.status === b?.status;
        }),
      );
  }

  public updateOIDCConfiguration($event: Omit<OIDCConfigurationModel, 'id'>) {
    this.store$.dispatch(updateDraftOIDCConfiguration({ oidcConfiguration: $event }));
  }

  public toggleDefaultOIDCConfiguration(oidcConfigurationName: string) {
    this.configService.saveConfig$({
      key: ConfigService.DEFAULT_APPLICATION_KEY,
      value: oidcConfigurationName,
      jsonValue: null,
    }).pipe(take(1)).subscribe();
  }

}
