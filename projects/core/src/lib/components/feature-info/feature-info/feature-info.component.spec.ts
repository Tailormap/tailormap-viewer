import { render, screen } from '@testing-library/angular';
import { FeatureInfoComponent } from './feature-info.component';

describe('FeatureInfoComponent', () => {

  test('should render', async () => {
    await render(FeatureInfoComponent);
    expect(screen.getByText('feature-info works!'));
  });

});
