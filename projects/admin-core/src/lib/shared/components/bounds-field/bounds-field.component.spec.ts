import { render, screen } from '@testing-library/angular';
import { BoundsFieldComponent } from './bounds-field.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';

describe('BoundsFieldComponent', () => {

  test('should render', async () => {
    await render(BoundsFieldComponent, {
      imports: [SharedImportsModule],
    });
    expect(screen.getByText('Bounds'));
  });

});
