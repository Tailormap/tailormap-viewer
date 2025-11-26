import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, Observable, of } from 'rxjs';
import { selectDraftOIDCConfiguration } from '../state/oidc-configuration.selectors';
import { OIDCConfigurationModel } from '@tailormap-admin/admin-api';
import { updateDraftOIDCConfiguration } from '../state/oidc-configuration.actions';

@Component({
  selector: 'tm-admin-oidc-configuration-edit-settings',
  templateUrl: './oidc-configuration-edit-settings.component.html',
  styleUrls: ['./oidc-configuration-edit-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class OIDCConfigurationEditSettingsComponent implements OnInit {
  private store$ = inject(Store);


  public oidcConfiguration$: Observable<OIDCConfigurationModel | undefined | null> = of(null);

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

}
