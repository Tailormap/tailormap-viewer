import {render, screen, fireEvent} from '@testing-library/angular';
import { ApiComponent } from './api.component';
import { SharedModule } from '@tailormap-viewer/shared';

describe('ApiComponent', () => {

  test('should create', async () => {
    const { container } = await render(ApiComponent, {
      imports: [ SharedModule ],
    });
    expect(container).toMatchSnapshot();
    expect(screen.getByText('api works!'));
  });

  test('should change the message after clicking', async () => {
    await render(ApiComponent, {
      imports: [ SharedModule ],
    });
    expect(screen.getByText('there'));
    fireEvent.click(screen.getByText('Update the message'));
    expect(screen.getByText('who are you?'));
  });

});
