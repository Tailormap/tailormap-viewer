import { render, screen } from '@testing-library/angular';
import { FormListComponent } from './form-list.component';

describe('FormListComponent', () => {

  test('should render', async () => {
    await render(FormListComponent);
    expect(screen.getByText('form-list works!'));
  });

});
