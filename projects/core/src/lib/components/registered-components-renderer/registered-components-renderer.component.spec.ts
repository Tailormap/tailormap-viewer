import { render, screen } from '@testing-library/angular';
import { RegisteredComponentsRendererComponent } from './registered-components-renderer.component';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { ComponentRegistrationService } from '../../services/component-registration.service';
import { provideMockStore } from '@ngrx/store/testing';
import { selectIn3DView } from '../../map/state/map.selectors';

@Component({
  selector: 'tm-testing',
  template: 'TESTING CONTROLS',
})
class TmTestingComponent {}

const mockedControlsService = {
  getRegisteredComponents$: () => {
    return of([{ type: 'TEST', component: TmTestingComponent }]);
  },
};

describe('RegisteredComponentsRendererComponent', () => {

  test('should render', async () => {
    await render(RegisteredComponentsRendererComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ComponentRegistrationService, useValue: mockedControlsService },
        provideMockStore({ selectors: [{ selector: selectIn3DView, value: false }] }),
      ],
    });
    expect(await screen.findByText(/TESTING CONTROLS/)).toBeInTheDocument();
  });

});
