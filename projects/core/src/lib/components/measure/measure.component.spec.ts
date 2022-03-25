import { render, screen } from '@testing-library/angular';
import { MeasureComponent } from './measure.component';

describe('MeasureComponent', () => {

  test('should render', async () => {
    await render(MeasureComponent);
    expect(screen.getByText('LINE'));
  });

});
