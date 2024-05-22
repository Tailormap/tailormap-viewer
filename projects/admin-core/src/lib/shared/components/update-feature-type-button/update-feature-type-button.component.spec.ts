import { render, screen } from '@testing-library/angular';
import { UpdateFeatureTypeButtonComponent } from './update-feature-type-button.component';

describe('UpdateFeatureTypeButtonComponent', () => {

  test('should render', async () => {
    await render(UpdateFeatureTypeButtonComponent);
    expect(screen.getByText('update-feature-type-button works!'));
  });

});
