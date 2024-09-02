import { render, screen } from '@testing-library/angular';
import { ErrorMessageComponent } from './error-message.component';

describe('ErrorMessageComponent', () => {

  test('should render', async () => {
    await render(ErrorMessageComponent, {
      inputs: { message: 'Some error message' },
    });
    expect(screen.getByText('Some error message'));
  });

});
