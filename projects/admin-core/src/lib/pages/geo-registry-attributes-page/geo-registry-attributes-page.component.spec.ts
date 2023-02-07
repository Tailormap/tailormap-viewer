import { render, screen } from '@testing-library/angular';
import { GeoRegistryAttributesPageComponent } from './geo-registry-attributes-page.component';
import { AdminTemplateComponent } from '../../templates/admin-template/admin-template.component';
import { NavigationComponent } from '../../templates/admin-template/navigation/navigation.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '@tailormap-viewer/shared';

describe('GeoRegistryAttributesPageComponent', () => {

  test('should render', async () => {
    await render(GeoRegistryAttributesPageComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [ AdminTemplateComponent, NavigationComponent ],
    });
    expect(screen.getByText('Geo Registry - Attributes'));
  });

});
