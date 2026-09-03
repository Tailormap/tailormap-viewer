import { render, screen } from '@testing-library/angular';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MenubarComponent } from './menubar.component';
import { of } from 'rxjs';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MenubarButtonComponent } from './menubar-button/menubar-button.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentRegistrationService } from '../../services/component-registration.service';
import { provideMockStore } from '@ngrx/store/testing';
import { selectIn3dView } from '../../map/state/map.selectors';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper';

@Component({
  selector: 'tm-menu-button-test',
  imports: [MenubarButtonComponent],
  template: '<tm-menubar-button icon="test" [tooltip]="tooltip">Click me</tm-menubar-button>',
})
class TmTestingComponent {
  public tooltip = 'MenuButton';
}

const mockedControlsService = {
  getRegisteredComponents$: () => {
    return of([{ type: 'TEST', component: TmTestingComponent }]);
  },
  registerComponent: vi.fn(),
  deregisterComponent: vi.fn(),
};

describe('MenubarComponent', () => {

  test('should render', async () => {
    await render(MenubarComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        NoopAnimationsModule,
        MatIconTestingModule,
      ],
      providers: [
        { provide: ComponentRegistrationService, useValue: mockedControlsService },
        provideMockStore({ selectors: [{ selector: selectIn3dView, value: false }] }),
        AuthenticatedUserTestHelper.provideAuthenticatedUserService(false, []),
      ],
    });
    expect(await screen.findByText(/Click me/)).toBeInTheDocument();
  });

});
