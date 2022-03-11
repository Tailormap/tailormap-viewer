import { render, screen } from '@testing-library/angular';
import { FeatureInfoHighlightComponent } from './feature-info-highlight.component';

describe('FeatureInfoHighlightComponent', () => {

  test('should render', async () => {
    await render(FeatureInfoHighlightComponent);
    expect(screen.getByText('feature-info-highlight works!'));
  });

});
