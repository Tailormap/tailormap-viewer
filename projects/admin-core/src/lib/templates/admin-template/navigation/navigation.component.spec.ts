import { render, screen } from '@testing-library/angular';
import { NavigationComponent } from './navigation.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('NavigationComponent', () => {

  test('should render', async () => {
    await render(NavigationComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
    });
    expect(await screen.findByText('Home')).toBeInTheDocument();
    expect(await screen.findByText('Catalog')).toBeInTheDocument();
  });

});
