import { Component, ChangeDetectionStrategy, inject, OnInit, DestroyRef, LOCALE_ID } from '@angular/core';
import { OIDCConfigurationService } from '../../oidc/services/oidc-configuration.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-home-page',
  templateUrl: './admin-home-page.component.html',
  styleUrls: ['./admin-home-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AdminHomePageComponent implements OnInit {

  private destroyRef = inject(DestroyRef);
  public locale = inject(LOCALE_ID);
  private oidcConfigurationService = inject(OIDCConfigurationService);

  // Not abstracted for now, just directly list any OIDC configurations with expiring client secrets
  public expiringOidcConfigs = this.oidcConfigurationService.getExpiringClientSecretConfigurations();

  public ngOnInit() {
    // Enable loading of OIDC configurations
    this.oidcConfigurationService.getOIDCConfigurations$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
