import { render, screen } from '@testing-library/angular';
import { ApplicationEditBaseLayersComponent } from './application-edit-base-layers.component';

describe('ApplicationEditBaseLayersComponent', () => {

  test('should render', async () => {
    await render(ApplicationEditBaseLayersComponent);
    expect(screen.getByText('application-edit-base-layers works!'));
  });

});
