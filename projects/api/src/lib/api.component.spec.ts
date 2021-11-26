import {render, screen, fireEvent} from '@testing-library/angular';
import { ApiComponent } from './api.component';

describe('ApiComponent', () => {

  test('should create', async () => {
    const { container } = await render(ApiComponent);
    expect(container).toMatchSnapshot();
    expect(screen.getByText('api works!'));
  });

  test('should change the message after clicking', async () => {
    await render(ApiComponent);
    expect(screen.getByText('there'));
    fireEvent.click(screen.getByText('Update the message'));
    expect(screen.getByText('who are you?'));
  });

});
