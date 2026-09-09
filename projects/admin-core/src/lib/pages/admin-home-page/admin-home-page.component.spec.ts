import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { AdminHomePageComponent } from './admin-home-page.component';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { OIDCConfigurationService } from '../../oidc/services/oidc-configuration.service';
import { signal } from '@angular/core';

describe('AdminHomePageComponent', () => {

  test('should render', async () => {
    const mockOIDCConfigurationService = {
      getOIDCConfigurations$: () => of([]),
      getExpiringClientSecretConfigurations: () => signal([]),
    };

    await render(AdminHomePageComponent, {
      imports: [],
      componentProviders: [
        { provide: Store, useValue: {} },
        { provide: OIDCConfigurationService, useValue: mockOIDCConfigurationService },
      ],
    });
    expect(screen.getByText('Welcome to Tailormap Admin'));
  });

});
