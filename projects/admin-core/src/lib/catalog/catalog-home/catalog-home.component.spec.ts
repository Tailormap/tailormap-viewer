import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { CatalogHomeComponent } from './catalog-home.component';
import { CatalogCreateButtonsComponent } from '../catalog-create-buttons/catalog-create-buttons.component';
import { Component } from '@angular/core';

@Component({
  selector: 'tm-admin-catalog-create-buttons',
  template: '<div>Catalog Create Buttons</div>',
})
class MockCatalogCreateButtonsComponent {}

describe('CatalogHomeComponent', () => {

  test('should render', async () => {
    await render(CatalogHomeComponent, {
      importOverrides: [
        { replace: CatalogCreateButtonsComponent, with: MockCatalogCreateButtonsComponent },
      ],
    });
    expect(screen.getByText('Catalog'));
  });

});
