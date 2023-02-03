import { render, screen } from '@testing-library/angular';
import { GeoRegistrySourcesPageComponent } from './geo-registry-sources-page.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AdminTemplateComponent } from '../../templates/admin-template/admin-template.component';
import { NavigationComponent } from '../../templates/admin-template/navigation/navigation.component';

describe('GeoRegistrySourcesPageComponent', () => {

  test('should render', async () => {
    await render(GeoRegistrySourcesPageComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [ AdminTemplateComponent, NavigationComponent ],
    });
    expect(screen.getByText('Geo Registry - Sources'));
  });

});
