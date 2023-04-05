import { render, screen } from '@testing-library/angular';
import { ApplicationPageComponent } from './application-page.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AdminTemplateComponent } from '../../templates/admin-template/admin-template.component';
import { NavigationComponent } from '../../templates/admin-template/navigation/navigation.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('CatalogPageComponent', () => {

  test('should render', async () => {
    await render(ApplicationPageComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [ AdminTemplateComponent, NavigationComponent ],
    });
    // Menu item and title
    expect(await screen.findAllByText('Applications')).toHaveLength(2);
  });

});
