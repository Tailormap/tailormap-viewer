import { render, screen } from '@testing-library/angular';
import { FeatureInfoContentComponent } from './feature-info-content.component';

describe('FeatureInfoContentComponent', () => {

  test('should render', async () => {
    await render(FeatureInfoContentComponent);
    expect(screen.getByText('feature-info-content works!'));
  });

});
