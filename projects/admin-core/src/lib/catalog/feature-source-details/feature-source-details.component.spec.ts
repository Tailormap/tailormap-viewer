import { render, screen } from '@testing-library/angular';
import { FeatureSourceDetailsComponent } from './feature-source-details.component';

describe('FeatureSourceDetailsComponent', () => {

  test('should render', async () => {
    await render(FeatureSourceDetailsComponent);
    expect(screen.getByText('feature-source-details works!'));
  });

});
