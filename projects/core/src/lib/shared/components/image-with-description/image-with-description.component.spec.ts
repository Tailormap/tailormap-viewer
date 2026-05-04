import { render, screen } from '@testing-library/angular';
import { ImageWithDescriptionComponent } from './image-with-description.component';

describe('ImageWithDescriptionComponent', () => {

  test('should render', async () => {
    await render(ImageWithDescriptionComponent);
    expect(screen.getByText('image-with-description works!'));
  });

});
