import { render, screen } from '@testing-library/angular';
import { PanelComponentsComponent } from './panel-components.component';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PanelComponentsService } from './panel-components.service';
import { of } from 'rxjs';

@Component({
  selector: 'tm-testing',
  template: 'TESTING CONTROLS',
})
class TmTestingComponent {}

const mockedControlsService = {
  getRegisteredComponents$: () => {
    return of([TmTestingComponent]);
  },
};

describe('PanelComponentsComponent', () => {

  test('should render', async () => {
    await render(PanelComponentsComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: PanelComponentsService, useValue: mockedControlsService },
      ],
    });
    expect(await screen.findByText(/TESTING CONTROLS/)).toBeInTheDocument();
  });

});
