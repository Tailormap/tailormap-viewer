import { render, screen } from '@testing-library/angular';
import { InfoMessageComponent } from './info-message.component';

describe('InfoMessageComponent', () => {

  test('should render', async () => {
    await render(InfoMessageComponent, {
      componentProperties: { message: 'Some info message' },
    });
    expect(screen.getByText('Some info message'));
  });

});
