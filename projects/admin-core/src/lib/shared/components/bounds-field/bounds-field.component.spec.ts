import { render, screen } from '@testing-library/angular';
import { BoundsFieldComponent } from './bounds-field.component';

describe('BoundsFieldComponent', () => {

  test('should render', async () => {
    await render(BoundsFieldComponent);
    expect(screen.getByText('Bounds'));
  });

});
