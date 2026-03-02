import { render, screen } from '@testing-library/angular';
import { EditMobilePanelComponent } from './edit-mobile-panel.component';

describe('EditMobilePanelComponent', () => {

  test('should render', async () => {
    await render(EditMobilePanelComponent);
    expect(screen.getByText('edit-mobile-panel works!'));
  });

});
