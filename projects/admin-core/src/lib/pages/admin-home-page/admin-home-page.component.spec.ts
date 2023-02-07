import { render, screen } from '@testing-library/angular';
import { AdminHomePageComponent } from './admin-home-page.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AdminTemplateComponent } from '../../templates/admin-template/admin-template.component';
import { NavigationComponent } from '../../templates/admin-template/navigation/navigation.component';

describe('AdminHomePageComponent', () => {

  test('should render', async () => {
    await render(AdminHomePageComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [ AdminTemplateComponent, NavigationComponent ],
    });
    expect(screen.getByText('Tailormap Admin'));
  });

});
