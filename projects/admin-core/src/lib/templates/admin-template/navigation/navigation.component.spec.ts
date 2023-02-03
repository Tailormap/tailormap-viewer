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
    expect(await screen.findByText('Geo Registry')).toBeInTheDocument();
    expect(await screen.findByText('Services')).toBeInTheDocument();
    expect(await screen.findByText('Sources')).toBeInTheDocument();
    expect(await screen.findByText('Attributes')).toBeInTheDocument();
  });

});
