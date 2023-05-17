import { render, screen } from '@testing-library/angular';
import { GroupHomeComponent } from './group-home.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('GroupHomeComponent', () => {

  test('should render', async () => {
    await render(GroupHomeComponent, { imports: [ SharedImportsModule, MatIconTestingModule ] });
    expect(await screen.findByText('Add group')).toBeInTheDocument();
  });

});
