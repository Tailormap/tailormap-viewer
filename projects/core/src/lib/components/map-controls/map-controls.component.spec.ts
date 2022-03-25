import { render, screen } from '@testing-library/angular';
import { MapControlsComponent } from './map-controls.component';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MapControlsService } from './map-controls.service';
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

describe('MapComponent', () => {

  test('should render', async () => {
    await render(MapControlsComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: MapControlsService, useValue: mockedControlsService },
      ],
    });
    expect(await screen.findByText(/TESTING CONTROLS/)).toBeInTheDocument();
  });

});
