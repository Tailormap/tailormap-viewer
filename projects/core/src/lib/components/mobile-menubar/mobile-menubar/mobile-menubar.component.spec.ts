import { render, screen } from '@testing-library/angular';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { RegisteredComponentsRendererComponent } from '../../registered-components-renderer/registered-components-renderer.component';
import { ComponentRegistrationService } from '../../../services/component-registration.service';
import { provideMockStore } from '@ngrx/store/testing';
import { selectIn3dView } from '../../../map/state/map.selectors';
import { MobileMenubarComponent } from './mobile-menubar.component';

@Component({
  selector: 'tm-menu-button-test',
  standalone: false,
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
    await render(MobileMenubarComponent, {
      declarations: [RegisteredComponentsRendererComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        SharedModule,
        MatIconTestingModule,
      ],
      providers: [
        { provide: ComponentRegistrationService, useValue: mockedControlsService },
        provideMockStore({ selectors: [{ selector: selectIn3dView, value: false }] }),
      ],
    });
    expect(await screen.findByText(/Click me/)).toBeInTheDocument();
  });

});
