import { render, screen } from '@testing-library/angular';
import { CatalogHomeComponent } from './catalog-home.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('CatalogHomeComponent', () => {

  test('should render', async () => {
    await render(CatalogHomeComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    expect(screen.getByText('Catalog'));
  });

});
