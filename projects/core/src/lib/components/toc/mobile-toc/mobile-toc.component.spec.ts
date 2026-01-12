import { render, screen } from '@testing-library/angular';
import { MobileTocComponent } from './mobile-toc.component';

describe('MobileTocComponent', () => {

  test('should render', async () => {
    await render(MobileTocComponent);
    expect(screen.getByText('mobile-toc works!'));
  });

});
