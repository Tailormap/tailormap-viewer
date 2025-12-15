import { render, screen } from '@testing-library/angular';
import { MobileMenubarHomeComponent } from './mobile-menubar-home.component';
import { MenubarService } from '../../menubar';
import { of } from 'rxjs';
import { ComponentRegistrationService } from '../../../services/component-registration.service';
import { LayoutService } from '../../../layout/layout.service';
import { ProfileComponent } from '../../menubar/profile/profile.component';
import { RegisteredComponentsRendererComponent } from '../../registered-components-renderer/registered-components-renderer.component';
import { Component } from '@angular/core';

@Component({
  selector: 'tm-profile',
  standalone: false,
  template: '<tm-menubar-button icon="test">Click me</tm-menubar-button>',
})
class TmTestingComponent { }

const setup = async() => {
  const mockMenubarService = {
    getActiveComponent$: () => of({ componentId: 'MOBILE_MENUBAR_HOME' }),
    setMobilePanelHeight: () => {},
    registerComponent: () => {},
    deregisterComponent: () => {},
  };
  const mockComponentRegistrationService = {
    getRegisteredComponents$: () => of([]),
    registerComponent: () => {},
    deregisterComponent: () => {},
  };
  const mockLayoutService = {
    componentsConfig$: of({
      config: [],
      in3d: false,
    }),
    isComponentEnabled: jest.fn(() => true),
  };
  await render(MobileMenubarHomeComponent, {
    providers: [
      { provide: MenubarService, useValue: mockMenubarService },
      { provide: ComponentRegistrationService, useValue: mockComponentRegistrationService },
      { provide: LayoutService, useValue: mockLayoutService },
    ],
    declarations: [
      ProfileComponent,
      RegisteredComponentsRendererComponent,
    ],
  });
}

describe('MobileMenubarHomeComponent', () => {

  test('should render', async () => {
    await setup();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

});
