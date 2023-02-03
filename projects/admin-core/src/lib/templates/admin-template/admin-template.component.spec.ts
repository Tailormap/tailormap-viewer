import { render, screen } from '@testing-library/angular';
import { AdminTemplateComponent } from './admin-template.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { NavigationComponent } from './navigation/navigation.component';
import { SharedModule } from '@tailormap-viewer/shared';

describe('AdminComponent', () => {

  test('should render', async () => {
    await render(AdminTemplateComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [NavigationComponent],
      componentInputs: {
        pageTitle: 'admin works!',
      },
    });
    expect(await screen.findByText('admin works!'));
    expect(await screen.findByText('Home')).toBeInTheDocument();
    expect(await screen.findByText('Geo Registry')).toBeInTheDocument();
  });

});
