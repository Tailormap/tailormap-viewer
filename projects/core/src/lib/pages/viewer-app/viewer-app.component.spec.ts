import { render, screen } from '@testing-library/angular';
import { ViewerAppComponent } from './viewer-app.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('ViewerAppComponent', () => {

  test('should render', async () => {
    const { container } = await render(ViewerAppComponent, {
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    });
    expect(container.querySelector('tm-map')).not.toBeNull();
  });

});
