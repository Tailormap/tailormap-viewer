import { render, screen } from '@testing-library/angular';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MenubarComponent } from './menubar.component';
import { of } from 'rxjs';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MenubarButtonComponent } from './menubar-button/menubar-button.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RegisteredComponentsRendererComponent } from '../registered-components-renderer/registered-components-renderer.component';
import { ComponentRegistrationService } from '../../services/component-registration.service';
import { provideMockStore } from '@ngrx/store/testing';
import { selectIn3DView } from '../../map/state/map.selectors';

@Component({
  selector: 'tm-menu-button-test',
  template: '<tm-menubar-button icon="test" [tooltip$]="tooltip$">Click me</tm-menubar-button>',
})
class TmTestingComponent {
  public tooltip$ = of('MenuButton');
}

const mockedControlsService = {
  getRegisteredComponents$: () => {
    return of([{ type: 'TEST', component: TmTestingComponent }]);
  },
};

describe('MenubarComponent', () => {

  test('should render', async () => {
    await render(MenubarComponent, {
      declarations: [
        MenubarComponent,
        MenubarButtonComponent,
        RegisteredComponentsRendererComponent,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        SharedModule,
        NoopAnimationsModule,
        MatIconTestingModule,
      ],
      providers: [
        { provide: ComponentRegistrationService, useValue: mockedControlsService },
        provideMockStore({ selectors: [{ selector: selectIn3DView, value: false }] }),
      ],
    });
    expect(await screen.findByText(/Click me/)).toBeInTheDocument();
  });

});
